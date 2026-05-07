package com.klc.logicroute.service

import com.klc.logicroute.data.api.LocationApi
import com.klc.logicroute.data.local.OfflineQueue
import com.klc.logicroute.data.model.LocationUpdate
import com.klc.logicroute.data.repository.AuthRepository
import com.klc.logicroute.util.GpsLocation
import com.klc.logicroute.util.LocationTracker
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.datetime.Clock

class LocationService(
    private val locationTracker: LocationTracker,
    private val locationApi: LocationApi,
    private val offlineQueue: OfflineQueue,
    private val authRepository: AuthRepository
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var trackingJob: Job? = null
    private var batchJob: Job? = null

    private val locationBuffer = mutableListOf<LocationUpdate>()
    private val bufferMutex = Mutex()

    private val _currentLocation = MutableStateFlow<GpsLocation?>(null)
    val currentLocation: StateFlow<GpsLocation?> = _currentLocation

    private val _isTracking = MutableStateFlow(false)
    val isTracking: StateFlow<Boolean> = _isTracking

    companion object {
        const val BATCH_INTERVAL_MS = 60_000L // 60 seconds
        const val MAX_BATCH_SIZE = 50
    }

    fun startTracking() {
        if (trackingJob?.isActive == true) return

        _isTracking.value = true

        trackingJob = scope.launch {
            val driverId = authRepository.getUserId() ?: return@launch
            locationTracker.startTracking().collect { location ->
                _currentLocation.value = location

                val update = LocationUpdate(
                    driverId = driverId,
                    latitude = location.latitude,
                    longitude = location.longitude,
                    speed = location.speed,
                    heading = location.heading,
                    accuracy = location.accuracy,
                    timestamp = Clock.System.now().toString()
                )

                bufferMutex.withLock {
                    locationBuffer.add(update)
                }
            }
        }

        // Start batch upload timer
        batchJob = scope.launch {
            while (isActive) {
                delay(BATCH_INTERVAL_MS)
                flushBatch()
            }
        }
    }

    fun stopTracking() {
        _isTracking.value = false
        trackingJob?.cancel()
        batchJob?.cancel()
        trackingJob = null
        batchJob = null
        locationTracker.stopTracking()

        // Flush remaining locations
        scope.launch { flushBatch() }
    }

    private suspend fun flushBatch() {
        val batch = bufferMutex.withLock {
            if (locationBuffer.isEmpty()) return
            val taken = locationBuffer.toList().take(MAX_BATCH_SIZE)
            locationBuffer.clear()
            taken
        }

        try {
            locationApi.sendLocations(batch)
        } catch (_: Exception) {
            // Save to offline queue for later retry
            offlineQueue.enqueueLocations(batch)
        }
    }
}
