package com.klc.logicroute.data.local

import com.klc.logicroute.data.api.LocationApi
import com.klc.logicroute.data.api.PodApi
import com.klc.logicroute.data.api.ShipmentApi
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.StateFlow

class SyncManager(
    private val offlineQueue: OfflineQueue,
    private val shipmentApi: ShipmentApi,
    private val podApi: PodApi,
    private val locationApi: LocationApi
) {
    private var syncJob: Job? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val pendingCount: StateFlow<Int> = offlineQueue.pendingCount

    fun startSync() {
        if (syncJob?.isActive == true) return
        syncJob = scope.launch {
            while (isActive) {
                syncPendingItems()
                delay(30_000) // Retry every 30 seconds
            }
        }
    }

    fun stopSync() {
        syncJob?.cancel()
        syncJob = null
    }

    suspend fun syncNow() {
        syncPendingItems()
    }

    private suspend fun syncPendingItems() {
        // Sync pending status updates
        val statusUpdates = offlineQueue.pendingStatusUpdates.value.toList()
        for (update in statusUpdates) {
            try {
                shipmentApi.updateStatus(update.shipmentId, update.status)
                offlineQueue.dequeueStatusUpdate(update)
            } catch (_: Exception) {
                // Will retry next cycle
                break
            }
        }

        // Sync pending PODs
        val pods = offlineQueue.pendingPods.value.toList()
        for (pod in pods) {
            try {
                podApi.uploadProofOfDelivery(
                    shipmentId = pod.shipmentId,
                    recipientName = pod.recipientName,
                    notes = pod.notes,
                    photoBytes = pod.photoBytes
                )
                offlineQueue.dequeuePod(pod)
            } catch (_: Exception) {
                break
            }
        }

        // Sync pending locations
        val locations = offlineQueue.pendingLocations.value
        if (locations.isNotEmpty()) {
            try {
                locationApi.sendLocations(locations)
                offlineQueue.clearLocations()
            } catch (_: Exception) {
                // Will retry next cycle
            }
        }
    }
}
