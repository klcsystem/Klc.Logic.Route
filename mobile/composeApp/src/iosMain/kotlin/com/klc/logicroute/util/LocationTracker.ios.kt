package com.klc.logicroute.util

import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.delay

actual class LocationTracker {
    private var tracking = false

    actual fun startTracking(): Flow<GpsLocation> = callbackFlow {
        tracking = true
        // In production, this would use CLLocationManager
        // For now, placeholder for GPS tracking
        while (tracking) {
            delay(10_000)
            // Actual CLLocationManager implementation would go here
        }
        awaitClose { tracking = false }
    }

    actual fun stopTracking() {
        tracking = false
    }

    actual fun isTracking(): Boolean = tracking
}
