package com.example.aurawear.presentation

import android.os.Bundle
import android.view.MotionEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInteropFilter
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material3.*
import com.example.aurawear.presentation.theme.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AURAWearTheme {
                AppScaffold {
                    AuraWatchApp()
                }
            }
        }
    }
}

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun AuraWatchApp(viewModel: WatchViewModel = viewModel()) {
    val state = viewModel.roomState
    val isPressed = viewModel.isPttPressed

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AuraBackground)
            .padding(8.dp),
        contentAlignment = Alignment.Center
    ) {
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
                        .background(if (state.isConnected) AuraAccentGreen else Color.Gray)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = if (state.isInRoom) state.roomId.uppercase() else "OFFLINE",
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
                .padding(horizontal = 16.dp),
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
                    state.isInRoom -> "READY"
                    else -> "WAITING"
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
                        if (!state.isInRoom) return@pointerInteropFilter false

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
