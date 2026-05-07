package com.klc.logicroute.data.api

import com.klc.logicroute.data.model.Shipment
import com.klc.logicroute.data.model.ShipmentStatus
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import kotlinx.serialization.Serializable

class ShipmentApi(private val client: HttpClient) {

    suspend fun getShipments(driverId: String): List<Shipment> {
        return client.get("mobile/shipments") {
            parameter("driverId", driverId)
        }.body()
    }

    suspend fun getShipment(id: String): Shipment {
        return client.get("mobile/shipments/$id").body()
    }

    suspend fun updateStatus(id: String, status: ShipmentStatus): Shipment {
        return client.put("mobile/shipments/$id/status") {
            setBody(StatusUpdateRequest(status = status))
        }.body()
    }
}

@Serializable
private data class StatusUpdateRequest(val status: ShipmentStatus)
