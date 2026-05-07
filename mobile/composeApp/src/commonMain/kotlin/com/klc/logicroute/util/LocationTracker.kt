package com.klc.logicroute.util

import com.klc.logicroute.data.model.LocationUpdate
import kotlinx.coroutines.flow.Flow

data class GpsLocation(
    val latitude: Double,
    val longitude: Double,
    val speed: Double = 0.0,
    val heading: Double = 0.0,
    val accuracy: Double = 0.0,
    val timestamp: Long = 0L
)

expect class LocationTracker() {
    fun startTracking(): Flow<GpsLocation>
    fun stopTracking()
    fun isTracking(): Boolean
}
