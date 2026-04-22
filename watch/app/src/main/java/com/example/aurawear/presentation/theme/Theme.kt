package com.example.aurawear.presentation.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material3.ColorScheme
import androidx.wear.compose.material3.MaterialTheme

val AuraBackground = Color(0xFF09090B)
val AuraSurface = Color(0xFF18181B)
val AuraSecondarySurface = Color(0xFF27272A)
val AuraBorder = Color(0xFF27272A)
val AuraPrimaryText = Color(0xFFFAFAFA)
val AuraSecondaryText = Color(0xFFA1A1AA)
val AuraTertiaryText = Color(0xFF71717A)
val AuraAccentGreen = Color(0xFF22C55E)

private val AuraColorScheme = ColorScheme(
    primary = AuraAccentGreen,
    onPrimary = Color.Black,
    secondary = AuraSecondarySurface,
    onSecondary = AuraPrimaryText,
    tertiary = AuraTertiaryText,
    onTertiary = AuraPrimaryText,
    background = AuraBackground,
    onBackground = AuraPrimaryText,
    surfaceContainer = AuraSurface,
    onSurface = AuraPrimaryText,
    onSurfaceVariant = AuraSecondaryText,
    outline = AuraBorder,
    error = Color(0xFFEF4444),
    onError = Color.White,
)

@Composable
fun AURAWearTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = AuraColorScheme,
        content = content
    )
}