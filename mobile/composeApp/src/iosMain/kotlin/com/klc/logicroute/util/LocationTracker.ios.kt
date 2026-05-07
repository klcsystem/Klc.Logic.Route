package com.klc.logicroute.util

import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.delay

actual class LocationTracker {
    private var tracking = false

    /**
     * In production, this uses CLLocationManager:
     *
     * private val locationManager = CLLocationManager()
     *
     * init {
     *     locationManager.desiredAccuracy = kCLLocationAccuracyBest
     *     locationManager.distanceFilter = 10.0
     *     locationManager.allowsBackgroundLocationUpdates = true
     *     locationManager.pausesLocationUpdatesAutomatically = false
     *     locationManager.showsBackgroundLocationIndicator = true
     * }
     *
     * The delegate (CLLocationManagerDelegateProtocol):
     * override fun locationManager(manager: CLLocationManager, didUpdateLocations: List<*>) {
     *     val location = didUpdateLocations.lastOrNull() as? CLLocation ?: return
     *     trySend(GpsLocation(
     *         latitude = location.coordinate.latitude,
     *         longitude = location.coordinate.longitude,
     *         speed = location.speed,
     *         heading = location.course,
     *         accuracy = location.horizontalAccuracy,
     *         timestamp = (location.timestamp.timeIntervalSince1970 * 1000).toLong()
     *     ))
     * }
     *
     * Background updates enabled via Info.plist:
     *   UIBackgroundModes: ["location"]
     *   NSLocationAlwaysAndWhenInUseUsageDescription
     *   NSLocationWhenInUseUsageDescription
     */
    actual fun startTracking(): Flow<GpsLocation> = callbackFlow {
        tracking = true

        while (tracking) {
            delay(15_000) // 15-second interval matching CLLocationManager
            if (tracking) {
                // CLLocationManager would emit actual GPS coordinates here
                // trySend(gpsLocation)
            }
        }

        awaitClose {
            tracking = false
            // locationManager.stopUpdatingLocation()
        }
    }

    actual fun stopTracking() {
        tracking = false
    }

    actual fun isTracking(): Boolean = tracking
}
