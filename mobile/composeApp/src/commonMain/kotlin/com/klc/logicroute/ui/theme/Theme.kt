package com.klc.logicroute.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = Orange500,
    onPrimary = SlateSurface,
    primaryContainer = Orange100,
    onPrimaryContainer = Orange700,
    secondary = Orange600,
    onSecondary = SlateSurface,
    background = SlateBackground,
    onBackground = SlateText,
    surface = SlateSurface,
    onSurface = SlateText,
    surfaceVariant = Orange50,
    onSurfaceVariant = SlateTextSecondary,
    error = ErrorRed,
    onError = SlateSurface
)

private val DarkColorScheme = darkColorScheme(
    primary = Orange500,
    onPrimary = DarkText,
    primaryContainer = Orange700,
    onPrimaryContainer = Orange100,
    secondary = Orange600,
    onSecondary = DarkText,
    background = DarkBackground,
    onBackground = DarkText,
    surface = DarkSurface,
    onSurface = DarkText,
    surfaceVariant = DarkSurface,
    onSurfaceVariant = DarkTextSecondary,
    error = ErrorRed,
    onError = DarkText
)

@Composable
fun LogicRouteTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        content = content
    )
}
