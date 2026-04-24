package com.aura.presentation

import android.Manifest
import android.app.Application
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import androidx.annotation.RequiresPermission
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.wear.remote.interactions.RemoteActivityHelper
import com.google.android.gms.wearable.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import org.json.JSONObject
import java.util.concurrent.Executors

data class RoomState(
    val roomId: String = "",
    val channelId: String = "",
    val channelName: String = "No Channel",
    val activeSpeakerName: String? = null,
    val isConnected: Boolean = false,
    val isInRoom: Boolean = false,
    val micSource: String = "phone", // "phone" or "watch"
    val isWatchActive: Boolean = false,
)

class WatchViewModel(application: Application) : AndroidViewModel(application), 
    DataClient.OnDataChangedListener, MessageClient.OnMessageReceivedListener {

    var roomState by mutableStateOf(RoomState())
        private set

    var isPttPressed by mutableStateOf(false)
        private set

    private val dataClient = Wearable.getDataClient(application)
    private val messageClient = Wearable.getMessageClient(application)
    private val nodeClient = Wearable.getNodeClient(application)
    private val remoteActivityHelper = RemoteActivityHelper(application, Executors.newSingleThreadExecutor())
    private val vibrator = application.getSystemService(Vibrator::class.java)

    private var cachedPhoneNodes: List<Node> = emptyList()

    private val sampleRate = 16000
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    private val bufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)

    init {
        dataClient.addListener(this)
        messageClient.addListener(this)
        
        // Listen for capability changes to detect phone connection
        val capabilityClient = Wearable.getCapabilityClient(application)
        viewModelScope.launch {
            try {
                // Log all nodes for debugging
                val allNodes = nodeClient.connectedNodes.await()
                Log.d("WatchViewModel", "Total connected nodes: ${allNodes.size}")
                cachedPhoneNodes = allNodes
                
                allNodes.forEach { node ->
                    Log.d("WatchViewModel", "Node: ${node.displayName}, ID: ${node.id}, isNearby: ${node.isNearby}")
                }

                // Check capability with FILTER_ALL first to see if it's even recognized
                val allCapabilityInfo = capabilityClient.getCapability("aura_phone_app", CapabilityClient.FILTER_ALL).await()
                Log.d("WatchViewModel", "Total phone nodes (FILTER_ALL): ${allCapabilityInfo.nodes.size}")

                // First check current nodes
                val capabilityInfo = capabilityClient.getCapability("aura_phone_app", CapabilityClient.FILTER_REACHABLE).await()
                Log.d("WatchViewModel", "Current reachable phone nodes: ${capabilityInfo.nodes.size}")
                
                // Use capability discovery to determine connection to the APP specifically
                updateConnectionStatus(capabilityInfo.nodes.isNotEmpty())

                // Then listen for changes
                capabilityClient.addListener(
                    {
                        Log.d("WatchViewModel", "Capability changed. Nodes: ${it.nodes.size}")
                        cachedPhoneNodes = it.nodes.toList()
                        updateConnectionStatus(it.nodes.isNotEmpty())
                    },
                    "aura_phone_app",
                )
            } catch (e: Exception) {
                Log.e("WatchViewModel", "Failed to setup capability listener", e)
            }
        }
    }

    @RequiresPermission(Manifest.permission.VIBRATE)
    private fun triggerHaptic(effectId: Int) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                vibrator.vibrate(VibrationEffect.createPredefined(effectId))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(50)
            }
        } catch (e: Exception) {
            // Ignore if effect not supported
        }
    }

    private fun updateConnectionStatus(connected: Boolean) {
        Log.d("WatchViewModel", "updateConnectionStatus: $connected")
        roomState = if (connected) {
            roomState.copy(isConnected = true)
        } else {
            // Reset state if phone app is no longer reachable
            RoomState(isConnected = false, isInRoom = false)
        }
        if (connected) {
            refreshState()
        }
    }

    private fun refreshState() {
        viewModelScope.launch {
            try {
                Log.d("WatchViewModel", "Refreshing state via DataClient...")
                // Notify phone that watch is connected and needs sync
                sendMessage("/watch_connected", "sync_request")
                Log.d("WatchViewModel", "Sent /watch_connected sync request")
                
                dataClient.getDataItems(Uri.parse("wear://*/room_state")).addOnSuccessListener { dataItems ->
                    Log.d("WatchViewModel", "Found ${dataItems.count} data items")
                    var found = false
                    dataItems.forEach { item ->
                        if (item.uri.path == "/room_state") {
                            val dataMap = DataMapItem.fromDataItem(item).dataMap
                            val stateJson = dataMap.getString("state")
                            Log.d("WatchViewModel", "Received state from ${item.uri.host}: $stateJson")
                            parseRoomState(stateJson)
                            found = true
                        }
                    }
                    dataItems.release()
                    
                    if (!found) {
                        Log.d("WatchViewModel", "No /room_state found in DataClient, waiting for message sync...")
                    }
                }
            } catch (e: Exception) {
                Log.e("WatchViewModel", "Failed to refresh state", e)
            }
        }
    }

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        Log.d("WatchViewModel", "onDataChanged: ${dataEvents.count} events received")
        dataEvents.forEach { event ->
            Log.d("WatchViewModel", "Event: type=${event.type}, uri=${event.dataItem.uri}")
            if (event.dataItem.uri.path == "/room_state") {
                if (event.type == DataEvent.TYPE_CHANGED) {
                    val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap
                    val stateJson = dataMap.getString("state")
                    Log.d("WatchViewModel", "State data received: $stateJson")
                    parseRoomState(stateJson)
                } else if (event.type == DataEvent.TYPE_DELETED) {
                    Log.d("WatchViewModel", "Room state deleted, resetting...")
                    roomState = roomState.copy(isInRoom = false)
                }
            }
        }
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d("WatchViewModel", "onMessageReceived: ${messageEvent.path}")
        when (messageEvent.path) {
            "/speaker_update" -> {
                try {
                    val json = JSONObject(String(messageEvent.data))
                    roomState = roomState.copy(
                        activeSpeakerName = if (json.isNull("activeSpeakerName")) null else json.getString("activeSpeakerName"),
                        channelId = json.optString("channelId", roomState.channelId)
                    )
                } catch (e: Exception) {
                    Log.e("WatchViewModel", "Failed to parse speaker update", e)
                }
            }
            "/room_state_sync" -> {
                parseRoomState(String(messageEvent.data))
            }
        }
    }

    private fun parseRoomState(jsonStr: String?) {
        Log.d("WatchViewModel", "parseRoomState input: $jsonStr")
        if (jsonStr.isNullOrEmpty()) return
        try {
            val json = JSONObject(jsonStr)
            val newRoomId = json.optString("roomId", "")
            val newChannelId = json.optString("channelId", "")
            val newInRoom = json.optBoolean("isInRoom", false)
            
            Log.d("WatchViewModel", "Parsed: roomId=$newRoomId, channelId=$newChannelId, isInRoom=$newInRoom")
            
            roomState = RoomState(
                roomId = newRoomId,
                channelId = newChannelId,
                channelName = json.optString("channelName", "No Channel"),
                activeSpeakerName = if (json.isNull("activeSpeakerName")) null else json.getString("activeSpeakerName"),
                isConnected = json.optBoolean("isConnected", roomState.isConnected),
                isInRoom = newInRoom,
                micSource = json.optString("micSource", "phone"),
                isWatchActive = json.optBoolean("isWatchActive", false),
            )
            Log.d("WatchViewModel", "New internal state: $roomState")
        } catch (e: Exception) {
            Log.e("WatchViewModel", "Failed to parse room state", e)
        }
    }

    @RequiresPermission(Manifest.permission.VIBRATE)
    fun onPttDown() {
        if (isPttPressed) return
        isPttPressed = true
        Log.d("WatchViewModel", "PTT Down")
        triggerHaptic(VibrationEffect.EFFECT_CLICK)
        sendMessage("/ptt_down", "")
        // Always start streaming from watch when PTT is pressed on watch.
        // The phone will automatically switch to this source.
        startAudioStreaming()
    }

    @RequiresPermission(Manifest.permission.VIBRATE)
    fun onPttUp() {
        if (!isPttPressed) return
        isPttPressed = false
        Log.d("WatchViewModel", "PTT Up")
        triggerHaptic(VibrationEffect.EFFECT_TICK)
        sendMessage("/ptt_up", "")
        stopAudioStreaming()
    }

    @RequiresPermission(Manifest.permission.VIBRATE)
    fun openPhoneApp() {
        Log.d("WatchViewModel", "Requesting to open phone app via RemoteActivityHelper and MessageClient")
        triggerHaptic(VibrationEffect.EFFECT_HEAVY_CLICK)
        
        viewModelScope.launch {
            try {
                val nodes = nodeClient.connectedNodes.await()
                nodes.forEach { node ->
                    // 1. Try modern RemoteActivityHelper
                    try {
                        val intent = Intent(Intent.ACTION_VIEW)
                            .addCategory(Intent.CATEGORY_BROWSABLE)
                            .setData("aura://join".toUri()) // Using the scheme from manifest
                        
                        // remoteActivityHelper.startRemoteActivity(intent, node.id).await()
                        remoteActivityHelper.startRemoteActivity(intent, node.id)
                        Log.d("WatchViewModel", "RemoteActivityHelper started for node ${node.id}")
                    } catch (e: Exception) {
                        Log.e("WatchViewModel", "RemoteActivityHelper failed for node ${node.id}", e)
                    }

                    // 2. Fallback to existing MessageClient trigger
                    messageClient.sendMessage(node.id, "/open_phone_app", "".toByteArray()).await()
                    
                    // 3. Proactively ask for a sync
                    messageClient.sendMessage(node.id, "/watch_connected", "".toByteArray()).await()
                }
            } catch (e: Exception) {
                Log.e("WatchViewModel", "Global openPhoneApp failure", e)
            }
        }
    }

    private var audioJob: Job? = null

    private fun startAudioStreaming() {
        if (ContextCompat.checkSelfPermission(getApplication(), Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            Log.e("WatchViewModel", "Audio permission not granted")
            return
        }

        audioJob?.cancel()
        audioJob = viewModelScope.launch(Dispatchers.IO) {
            val audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize
            )

            if (audioRecord.state != AudioRecord.STATE_INITIALIZED) {
                Log.e("WatchViewModel", "AudioRecord initialization failed")
                return@launch
            }

            try {
                audioRecord.startRecording()
                Log.d("WatchViewModel", "Starting audio stream...")
                val buffer = ByteArray(bufferSize / 2) // Smaller chunks for lower latency
                while (isPttPressed) {
                    val read = audioRecord.read(buffer, 0, buffer.size)
                    if (read > 0) {
                        val data = if (read == buffer.size) buffer else buffer.copyOfRange(0, read)
                        sendMessage("/audio_frame", data)
                    }
                }
            } catch (e: Exception) {
                Log.e("WatchViewModel", "Audio recording error", e)
            } finally {
                try {
                    audioRecord.stop()
                    audioRecord.release()
                } catch (_: Exception) {
                }
            }
        }
    }

    private fun stopAudioStreaming() {
        audioJob?.cancel()
        audioJob = null
        Log.d("WatchViewModel", "Stopped audio stream.")
    }

    private fun sendMessage(path: String, message: String) {
        // Optimize: Use cached nodes if available to avoid await() latency
        val nodes = cachedPhoneNodes.ifEmpty { 
            // Fallback: only if cache is empty, launch a discovery task
            viewModelScope.launch {
                try {
                    cachedPhoneNodes = nodeClient.connectedNodes.await()
                } catch (e: Exception) {}
            }
            return 
        }

        Log.d("WatchViewModel", "Sending message $path to ${nodes.size} nodes (cached)")
        for (node in nodes) {
            messageClient.sendMessage(node.id, path, message.toByteArray())
        }
    }

    private fun sendMessage(path: String, data: ByteArray) {
        val nodes = cachedPhoneNodes
        if (nodes.isEmpty()) return
        
        for (node in nodes) {
            messageClient.sendMessage(node.id, path, data)
        }
    }

    override fun onCleared() {
        super.onCleared()
        dataClient.removeListener(this)
        messageClient.removeListener(this)
    }
}
