package com.klc.logicroute.data.local

import com.klc.logicroute.data.model.LocationUpdate
import com.klc.logicroute.data.model.ShipmentStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.Serializable

@Serializable
data class PendingStatusUpdate(
    val shipmentId: String,
    val status: ShipmentStatus,
    val timestamp: Long
)

@Serializable
data class PendingPod(
    val shipmentId: String,
    val recipientName: String,
    val notes: String,
    val photoBytes: ByteArray?,
    val signatureBytes: ByteArray?,
    val timestamp: Long
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PendingPod) return false
        return shipmentId == other.shipmentId && timestamp == other.timestamp
    }

    override fun hashCode(): Int = shipmentId.hashCode() * 31 + timestamp.hashCode()
}

class OfflineQueue {
    private val mutex = Mutex()

    private val _pendingStatusUpdates = MutableStateFlow<List<PendingStatusUpdate>>(emptyList())
    val pendingStatusUpdates: StateFlow<List<PendingStatusUpdate>> = _pendingStatusUpdates

    private val _pendingPods = MutableStateFlow<List<PendingPod>>(emptyList())
    val pendingPods: StateFlow<List<PendingPod>> = _pendingPods

    private val _pendingLocations = MutableStateFlow<List<LocationUpdate>>(emptyList())
    val pendingLocations: StateFlow<List<LocationUpdate>> = _pendingLocations

    private val _pendingCount = MutableStateFlow(0)
    val pendingCount: StateFlow<Int> = _pendingCount

    private fun updateCount() {
        _pendingCount.value = _pendingStatusUpdates.value.size +
                _pendingPods.value.size +
                if (_pendingLocations.value.isNotEmpty()) 1 else 0
    }

    suspend fun enqueueStatusUpdate(shipmentId: String, status: ShipmentStatus) {
        mutex.withLock {
            _pendingStatusUpdates.value = _pendingStatusUpdates.value + PendingStatusUpdate(
                shipmentId = shipmentId,
                status = status,
                timestamp = currentTimeMillis()
            )
            updateCount()
        }
    }

    suspend fun dequeueStatusUpdate(update: PendingStatusUpdate) {
        mutex.withLock {
            _pendingStatusUpdates.value = _pendingStatusUpdates.value - update
            updateCount()
        }
    }

    suspend fun enqueuePod(
        shipmentId: String,
        recipientName: String,
        notes: String,
        photoBytes: ByteArray?,
        signatureBytes: ByteArray?
    ) {
        mutex.withLock {
            _pendingPods.value = _pendingPods.value + PendingPod(
                shipmentId = shipmentId,
                recipientName = recipientName,
                notes = notes,
                photoBytes = photoBytes,
                signatureBytes = signatureBytes,
                timestamp = currentTimeMillis()
            )
            updateCount()
        }
    }

    suspend fun dequeuePod(pod: PendingPod) {
        mutex.withLock {
            _pendingPods.value = _pendingPods.value - pod
            updateCount()
        }
    }

    suspend fun enqueueLocations(locations: List<LocationUpdate>) {
        mutex.withLock {
            _pendingLocations.value = _pendingLocations.value + locations
            updateCount()
        }
    }

    suspend fun dequeueLocations(count: Int): List<LocationUpdate> {
        return mutex.withLock {
            val taken = _pendingLocations.value.take(count)
            _pendingLocations.value = _pendingLocations.value.drop(count)
            updateCount()
            taken
        }
    }

    suspend fun clearLocations() {
        mutex.withLock {
            _pendingLocations.value = emptyList()
            updateCount()
        }
    }
}

private fun currentTimeMillis(): Long {
    return kotlinx.datetime.Clock.System.now().toEpochMilliseconds()
}
