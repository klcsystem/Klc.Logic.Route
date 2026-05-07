package com.klc.logicroute.util

import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.delay

actual class LocationTracker {
    private var tracking = false

    actual fun startTracking(): Flow<GpsLocation> = callbackFlow {
        tracking = true
        // In production, this would use FusedLocationProviderClient
        // For now, we emit periodic location updates as a placeholder
        while (tracking) {
            delay(10_000) // every 10 seconds
            // Actual GPS implementation would go here using
            // com.google.android.gms.location.LocationServices
        }
        awaitClose { tracking = false }
    }

    actual fun stopTracking() {
        tracking = false
    }

    actual fun isTracking(): Boolean = tracking
}
