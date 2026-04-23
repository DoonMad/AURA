package com.aura.service

import android.content.Intent
import android.util.Log
import com.aura.presentation.MainActivity
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService

class WatchLaunchService : WearableListenerService() {
    override fun onMessageReceived(messageEvent: MessageEvent) {
        Log.d("WatchLaunchService", "Message received: ${messageEvent.path}")
        if (messageEvent.path == "/start_wear_app") {
            Log.d("WatchLaunchService", "Starting MainActivity from remote command")
            val intent = Intent(this, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
        }
    }
}
