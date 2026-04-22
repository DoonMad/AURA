package com.aura

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.wearable.*
import com.google.android.gms.tasks.Tasks
import kotlinx.coroutines.*

class WatchBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), MessageClient.OnMessageReceivedListener, DataClient.OnDataChangedListener {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun getName() = "WatchBridge"

    init {
        Wearable.getMessageClient(reactContext).addListener(this)
        Wearable.getDataClient(reactContext).addListener(this)
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        val path = messageEvent.path
        val data = messageEvent.data
        Log.d("WatchBridge", "Message received: $path")

        val params = Arguments.createMap()
        params.putString("path", path)
        
        if (path == "/audio_frame") {
            // Audio frames are sent as byte arrays, we might want to handle them differently for performance
            // but for now let's pass them as base64 or similar if needed, 
            // though better to have a dedicated audio sink.
            sendEvent("onWatchAudioFrame", data)
        } else {
            params.putString("data", String(data))
            sendEvent("onWatchMessage", params)
        }
    }

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        // Handle data changes if needed
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
        scope.launch {
            try {
                val request = PutDataMapRequest.create("/room_state").apply {
                    dataMap.putString("state", stateJson)
                    dataMap.putLong("timestamp", System.currentTimeMillis())
                }.asPutDataRequest().setUrgent()
                
                Tasks.await(Wearable.getDataClient(reactApplicationContext).putDataItem(request))
            } catch (e: Exception) {
                Log.e("WatchBridge", "Failed to update room state", e)
            }
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
        super.onCatalystInstanceDestroy()
        Wearable.getMessageClient(reactApplicationContext).removeListener(this)
        Wearable.getDataClient(reactApplicationContext).removeListener(this)
        scope.cancel()
    }
}
