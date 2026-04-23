package com.aura

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.wearable.*
import com.google.android.gms.tasks.Tasks
import kotlinx.coroutines.*
import org.webrtc.PeerConnectionFactory
import com.oney.WebRTCModule.WebRTCModule

class WatchBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), MessageClient.OnMessageReceivedListener, DataClient.OnDataChangedListener {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val audioProvider = WatchAudioProvider(reactContext)

    override fun getName() = "WatchBridge"

    init {
        Wearable.getMessageClient(reactContext).addListener(this)
        Wearable.getDataClient(reactContext).addListener(this)
        
        // Log watch capability for debugging
        scope.launch {
            try {
                val capabilityClient = Wearable.getCapabilityClient(reactContext)
                val capabilityInfo = Tasks.await(capabilityClient.getCapability("aura_watch_app", CapabilityClient.FILTER_ALL))
                Log.d("WatchBridge", "Discovered watch nodes: ${capabilityInfo.nodes.size}")
                for (node in capabilityInfo.nodes) {
                    Log.d("WatchBridge", "Watch Node: ${node.displayName} (${node.id})")
                }
            } catch (e: Exception) {
                Log.e("WatchBridge", "Failed to check watch capability", e)
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for NativeEventEmitter
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        val path = messageEvent.path
        val data = messageEvent.data
        Log.d("WatchBridge", "Message received from ${messageEvent.sourceNodeId}: $path")

        if (path == "/audio_frame") {
            audioProvider.onAudioFrame(data)
            sendEvent("onWatchAudioFrame", data)
        } else if (path == "/watch_connected") {
            Log.d("WatchBridge", "Watch requested state sync")
            val params = Arguments.createMap()
            params.putString("path", path)
            params.putString("data", String(data))
            sendEvent("onWatchMessage", params)
        } else {
            val params = Arguments.createMap()
            params.putString("path", path)
            params.putString("data", String(data))
            sendEvent("onWatchMessage", params)
        }
    }

    @ReactMethod
    fun getWatchStreamId(promise: Promise) {
        promise.resolve(audioProvider.getStreamId())
    }

    @ReactMethod
    fun initAudioRelay(promise: Promise) {
        scope.launch {
            try {
                val webRTCModule = reactApplicationContext.getNativeModule(WebRTCModule::class.java)
                if (webRTCModule != null) {
                    val factoryField = WebRTCModule::class.java.getDeclaredField("mFactory")
                    factoryField.isAccessible = true
                    val factory = factoryField.get(webRTCModule) as PeerConnectionFactory
                    audioProvider.initialize(factory)
                    promise.resolve(true)
                } else {
                    promise.reject("ERR", "WebRTCModule not found")
                }
            } catch (e: Exception) {
                promise.reject("ERR", e.message)
            }
        }
    }

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        Log.d("WatchBridge", "onDataChanged: ${dataEvents.count} events")
    }

    @ReactMethod
    fun sendMessage(path: String, message: String) {
        scope.launch {
            try {
                val nodes = Tasks.await(Wearable.getNodeClient(reactApplicationContext).connectedNodes)
                for (node in nodes) {
                    Wearable.getMessageClient(reactApplicationContext).sendMessage(
                        node.id,
                        path,
                        message.toByteArray()
                    )
                }
            } catch (e: Exception) {
                Log.e("WatchBridge", "Failed to send message", e)
            }
        }
    }

    @ReactMethod
    fun updateRoomState(stateJson: String) {
        Log.d("WatchBridge", "updateRoomState called with: $stateJson")
        scope.launch {
            try {
                // Ensure nodes are fresh
                val nodes = Tasks.await(Wearable.getNodeClient(reactApplicationContext).connectedNodes)
                Log.d("WatchBridge", "Connected nodes for state update: ${nodes.size}")
                
                for (node in nodes) {
                    // Send state via message as a fast fallback to DataClient
                    // We REMOVED /start_wear_app from here to prevent constant restarts
                    Wearable.getMessageClient(reactApplicationContext).sendMessage(
                        node.id,
                        "/room_state_sync",
                        stateJson.toByteArray()
                    )
                    Log.d("WatchBridge", "Sent /room_state_sync message to node ${node.id}")
                }

                val request = PutDataMapRequest.create("/room_state").apply {
                    dataMap.putString("state", stateJson)
                    dataMap.putLong("timestamp", System.currentTimeMillis())
                }.asPutDataRequest().setUrgent()
                
                val result = Tasks.await(Wearable.getDataClient(reactApplicationContext).putDataItem(request))
                Log.d("WatchBridge", "PutDataMapRequest success: ${result.uri}")
            } catch (e: Exception) {
                Log.e("WatchBridge", "Failed to update room state", e)
            }
        }
    }

    @ReactMethod
    fun startWatchApp() {
        scope.launch {
            try {
                val nodes = Tasks.await(Wearable.getNodeClient(reactApplicationContext).connectedNodes)
                for (node in nodes) {
                    Wearable.getMessageClient(reactApplicationContext).sendMessage(node.id, "/start_wear_app", null)
                    Log.d("WatchBridge", "Sent /start_wear_app to node ${node.id}")
                }
            } catch (e: Exception) {
                Log.e("WatchBridge", "Failed to start watch app", e)
            }
        }
    }

    @ReactMethod
    fun openPhoneApp(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (intent != null) {
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.reject("ERR", "Launch intent not found")
            }
        } catch (e: Exception) {
            promise.reject("ERR", e.message)
        }
    }

    private fun sendEvent(eventName: String, params: Any?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun sendEvent(eventName: String, data: ByteArray) {
        val base64 = android.util.Base64.encodeToString(data, android.util.Base64.NO_WRAP)
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, base64)
    }

    override fun onCatalystInstanceDestroy() {
        Log.d("WatchBridge", "Shutting down, notifying watch...")
        // Run on GlobalScope for shutdown to ensure it has a chance to finish even if this module is destroyed
        GlobalScope.launch(Dispatchers.IO) {
            try {
                val nodes = Tasks.await(Wearable.getNodeClient(reactApplicationContext).connectedNodes)
                for (node in nodes) {
                    Wearable.getMessageClient(reactApplicationContext).sendMessage(
                        node.id,
                        "/room_state_sync",
                        "{\"isInRoom\":false}".toByteArray()
                    )
                }
                
                Wearable.getDataClient(reactApplicationContext).deleteDataItems(
                    android.net.Uri.parse("wear://*/room_state")
                )
            } catch (e: Exception) {
                Log.e("WatchBridge", "Shutdown sync failed", e)
            }
        }
        
        super.onCatalystInstanceDestroy()
        Wearable.getMessageClient(reactApplicationContext).removeListener(this)
        Wearable.getDataClient(reactApplicationContext).removeListener(this)
        scope.cancel()
    }
}
