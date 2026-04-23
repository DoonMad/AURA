package com.aura

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.oney.WebRTCModule.WebRTCModule
import org.webrtc.*
import java.nio.ByteBuffer
import java.util.concurrent.Executors

class WatchAudioProvider(private val reactContext: ReactApplicationContext) {
    private var audioTrack: AudioTrack? = null
    private var audioSource: AudioSource? = null
    private var mediaStream: MediaStream? = null
    private val streamId = "watch-mic-stream"
    private val trackId = "watch-mic-track"

    private val executor = Executors.newSingleThreadExecutor()

    fun getStreamId(): String = streamId

    fun initialize(factory: PeerConnectionFactory) {
        if (mediaStream != null) return

        audioSource = factory.createAudioSource(MediaConstraints())
        audioTrack = factory.createAudioTrack(trackId, audioSource)
        mediaStream = factory.createLocalMediaStream(streamId)
        mediaStream?.addTrack(audioTrack)

        registerWithWebRTCModule()
    }

    private fun registerWithWebRTCModule() {
        try {
            val webRTCModule = reactContext.getNativeModule(WebRTCModule::class.java)
            if (webRTCModule != null) {
                val localStreamsField = WebRTCModule::class.java.getDeclaredField("localStreams")
                localStreamsField.isAccessible = true
                val localStreams = localStreamsField.get(webRTCModule) as MutableMap<String, MediaStream>
                mediaStream?.let {
                    localStreams[streamId] = it
                    Log.d("WatchAudioProvider", "Registered watch stream with WebRTCModule")
                }
            }
        } catch (e: Exception) {
            Log.e("WatchAudioProvider", "Failed to register stream with WebRTCModule", e)
        }
    }

    private var framesReceived = 0
    private var lastLogTime = 0L

    fun onAudioFrame(data: ByteArray) {
        framesReceived++
        val now = System.currentTimeMillis()
        if (now - lastLogTime > 5000) {
            Log.d("WatchAudioProvider", "Received $framesReceived audio frames from watch (last chunk: ${data.size} bytes)")
            lastLogTime = now
        }

        // TODO: Inject into WebRTC pipeline
    }

    fun dispose() {
        executor.shutdown()
        mediaStream = null
        audioTrack = null
        audioSource = null
    }
}
