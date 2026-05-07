package com.klc.logicroute.data.repository

import com.klc.logicroute.data.api.PodApi

class PodRepository(
    private val podApi: PodApi
) {
    suspend fun uploadProofOfDelivery(
        shipmentId: String,
        recipientName: String,
        notes: String,
        photoBytes: ByteArray?
    ): Result<Unit> {
        return try {
            podApi.uploadProofOfDelivery(shipmentId, recipientName, notes, photoBytes)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
