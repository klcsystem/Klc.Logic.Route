package com.klc.logicroute.util

import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.delay

actual class LocationTracker {
    private var tracking = false

    /**
     * In production, this uses FusedLocationProviderClient:
     *
     * val locationRequest = LocationRequest.Builder(
     *     Priority.PRIORITY_HIGH_ACCURACY, 15_000L
     * ).setMinUpdateDistanceMeters(10f).build()
     *
     * val locationCallback = object : LocationCallback() {
     *     override fun onLocationResult(result: LocationResult) {
     *         result.lastLocation?.let { location ->
     *             trySend(GpsLocation(
     *                 latitude = location.latitude,
     *                 longitude = location.longitude,
     *                 speed = location.speed.toDouble(),
     *                 heading = location.bearing.toDouble(),
     *                 accuracy = location.accuracy.toDouble(),
     *                 timestamp = location.time
     *             ))
     *         }
     *     }
     * }
     *
     * fusedLocationClient.requestLocationUpdates(
     *     locationRequest, locationCallback, Looper.getMainLooper()
     * )
     *
     * Also requires a Foreground Service (LocationForegroundService) with
     * FOREGROUND_SERVICE_TYPE_LOCATION to continue tracking when app is backgrounded.
     * The service shows a persistent notification: "LogicRoute konum takibi aktif"
     */
    actual fun startTracking(): Flow<GpsLocation> = callbackFlow {
        tracking = true

        while (tracking) {
            delay(15_000) // 15-second interval matching FusedLocationProviderClient
            if (tracking) {
                // FusedLocationProviderClient would emit actual GPS coordinates here
                // trySend(gpsLocation)
            }
        }

        awaitClose {
            tracking = false
            // fusedLocationClient.removeLocationUpdates(locationCallback)
        }
    }

    actual fun stopTracking() {
        tracking = false
    }

    actual fun isTracking(): Boolean = tracking
}
