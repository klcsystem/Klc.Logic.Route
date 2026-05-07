package com.klc.logicroute.data.repository

import com.klc.logicroute.data.api.ShipmentApi
import com.klc.logicroute.data.model.Shipment
import com.klc.logicroute.data.model.ShipmentStatus

class ShipmentRepository(
    private val shipmentApi: ShipmentApi
) {
    suspend fun getShipments(driverId: String): Result<List<Shipment>> {
        return try {
            Result.success(shipmentApi.getShipments(driverId))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getShipment(id: String): Result<Shipment> {
        return try {
            Result.success(shipmentApi.getShipment(id))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateStatus(id: String, status: ShipmentStatus): Result<Shipment> {
        return try {
            Result.success(shipmentApi.updateStatus(id, status))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
