package com.aura.presentation

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.MotionEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInteropFilter
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material3.*
import com.aura.presentation.theme.*
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AURAWearTheme {
                AuraWatchApp()
            }
        }
    }
}

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun AuraWatchApp(viewModel: WatchViewModel = viewModel()) {
    val context = LocalContext.current
    val state = viewModel.roomState
    val isPressed = viewModel.isPttPressed

    // Request permissions
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            android.util.Log.e("AuraWatchApp", "Microphone permission denied. Watch PTT will not transmit audio.")
        }
    }

    LaunchedEffect(Unit) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    // UI State Logic
    val showContinueOnPhone = remember { mutableStateOf(false) }
    
    LaunchedEffect(state.isConnected, state.isInRoom) {
        if (state.isConnected && !state.isInRoom) {
            // Show "Continue on Phone" faster if we are connected but not in a room
            delay(1000)
            if (state.isConnected && !state.isInRoom) {
                showContinueOnPhone.value = true
            }
        } else {
            showContinueOnPhone.value = false
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AuraBackground)
            .padding(8.dp),
        contentAlignment = Alignment.Center
    ) {
        if (!state.isConnected) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "DISCONNECTED",
                    style = MaterialTheme.typography.titleSmall,
                    color = AuraSecondaryText
                )
                Text(
                    text = "CHECK PHONE CONNECTION",
                    style = MaterialTheme.typography.labelSmall,
                    color = AuraTertiaryText
                )
            }
        } else if (!state.isInRoom) {
            if (showContinueOnPhone.value) {
                Column(
                    modifier = Modifier.clickable { viewModel.openPhoneApp() },
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "CONTINUE ON PHONE",
                        style = MaterialTheme.typography.titleSmall,
                        color = AuraPrimaryText,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "TAP TO OPEN APP",
                        style = MaterialTheme.typography.labelSmall,
                        color = AuraSecondaryText,
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                Text(
                    text = "WAITING FOR SYNC...",
                    style = MaterialTheme.typography.labelSmall,
                    color = AuraTertiaryText
                )
            }
        } else {
            // Main Room UI
            MainRoomUI(state, isPressed, viewModel)
        }
    }
}

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun MainRoomUI(state: RoomState, isPressed: Boolean, viewModel: WatchViewModel) {
    Box(modifier = Modifier.fillMaxSize()) {
        // Top Status
        Column(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(AuraAccentGreen)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = state.roomId.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = AuraSecondaryText,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        // Main Content (Channel & Speaker)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = state.channelName.uppercase(),
                style = MaterialTheme.typography.titleMedium,
                color = AuraPrimaryText,
                fontWeight = FontWeight.Black,
                textAlign = TextAlign.Center,
                maxLines = 1
            )
            
            Text(
                text = when {
                    state.activeSpeakerName != null -> state.activeSpeakerName
                    else -> "READY"
                },
                style = MaterialTheme.typography.bodySmall,
                color = if (state.activeSpeakerName != null) AuraAccentGreen else AuraTertiaryText,
                textAlign = TextAlign.Center,
                maxLines = 1
            )
            
            Spacer(modifier = Modifier.height(8.dp))

            // PTT Button
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(if (isPressed) AuraAccentGreen else AuraSurface)
                    .border(
                        width = 2.dp,
                        color = if (isPressed) AuraAccentGreen else AuraBorder,
                        shape = CircleShape
                    )
                    .pointerInteropFilter {
                        when (it.action) {
                            MotionEvent.ACTION_DOWN -> {
                                viewModel.onPttDown()
                                true
                            }
                            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                                viewModel.onPttUp()
                                true
                            }
                            else -> false
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (isPressed) "TALK" else "PTT",
                    style = MaterialTheme.typography.labelLarge,
                    color = if (isPressed) Color.Black else AuraPrimaryText,
                    fontWeight = FontWeight.ExtraBold
                )
            }
        }

        // Bottom Source
        Text(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 12.dp),
            text = "${state.micSource.uppercase()} MIC",
            style = MaterialTheme.typography.labelSmall,
            color = AuraTertiaryText,
            fontSize = 8.sp
        )
    }
}
