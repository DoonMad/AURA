package com.example.aurawear.presentation

import android.app.Application
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.wearable.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import org.json.JSONObject

data class RoomState(
    val roomId: String = "",
    val channelId: String = "",
    val channelName: String = "No Channel",
    val activeSpeakerName: String? = null,
    val isConnected: Boolean = false,
    val isInRoom: Boolean = false,
    val micSource: String = "phone", // "phone" or "watch"
    val isWatchActive: Boolean = false
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

    init {
        dataClient.addListener(this)
        messageClient.addListener(this)
        refreshState()
    }

    private fun refreshState() {
        viewModelScope.launch {
            try {
                val dataItems = dataClient.getDataItems(android.net.Uri.parse("wear://*/room_state")).await()
                dataItems.forEach { item ->
                    if (item.uri.path == "/room_state") {
                        val dataMap = DataMapItem.fromDataItem(item).dataMap
                        val stateJson = dataMap.getString("state")
                        parseRoomState(stateJson)
                    }
                }
                dataItems.release()
                
                // Notify phone that watch is connected
                sendMessage("/watch_connected", "")
            } catch (e: Exception) {
                Log.e("WatchViewModel", "Failed to refresh state", e)
            }
        }
    }

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        dataEvents.forEach { event ->
            if (event.type == DataEvent.TYPE_CHANGED && event.dataItem.uri.path == "/room_state") {
                val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap
                val stateJson = dataMap.getString("state")
                parseRoomState(stateJson)
            }
        }
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
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
        if (jsonStr == null || jsonStr.isEmpty()) return
        try {
            val json = JSONObject(jsonStr)
            roomState = RoomState(
                roomId = json.optString("roomId", ""),
                channelId = json.optString("channelId", ""),
                channelName = json.optString("channelName", "No Channel"),
                activeSpeakerName = if (json.isNull("activeSpeakerName")) null else json.getString("activeSpeakerName"),
                isConnected = json.optBoolean("isConnected", false),
                isInRoom = json.optBoolean("isInRoom", false),
                micSource = json.optString("micSource", "phone"),
                isWatchActive = json.optBoolean("isWatchActive", false)
            )
        } catch (e: Exception) {
            Log.e("WatchViewModel", "Failed to parse room state", e)
        }
    }

    fun onPttDown() {
        if (isPttPressed) return
        isPttPressed = true
        sendMessage("/ptt_down", "")
        if (roomState.micSource == "watch") {
            startAudioStreaming()
        }
    }

    fun onPttUp() {
        if (!isPttPressed) return
        isPttPressed = false
        sendMessage("/ptt_up", "")
        stopAudioStreaming()
    }

    private var audioJob: Job? = null

    private fun startAudioStreaming() {
        audioJob?.cancel()
        audioJob = viewModelScope.launch(Dispatchers.IO) {
            // Actual AudioRecord implementation would go here
            Log.d("WatchViewModel", "Starting audio stream...")
            while (isPttPressed) {
                // val buffer = readFromMic()
                // sendMessage("/audio_frame", buffer)
                delay(40)
            }
        }
    }

    private fun stopAudioStreaming() {
        audioJob?.cancel()
        audioJob = null
        Log.d("WatchViewModel", "Stopped audio stream.")
    }

    private fun sendMessage(path: String, message: String) {
        viewModelScope.launch {
            try {
                val nodes = nodeClient.connectedNodes.await()
                nodes.forEach { node ->
                    messageClient.sendMessage(node.id, path, message.toByteArray()).await()
                }
            } catch (e: Exception) {
                Log.e("WatchViewModel", "Failed to send message: $path", e)
            }
        }
    }

    private fun sendMessage(path: String, data: ByteArray) {
        viewModelScope.launch {
            try {
                val nodes = nodeClient.connectedNodes.await()
                nodes.forEach { node ->
                    messageClient.sendMessage(node.id, path, data).await()
                }
            } catch (e: Exception) {
                Log.e("WatchViewModel", "Failed to send data: $path", e)
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        dataClient.removeListener(this)
        messageClient.removeListener(this)
    }
}
