package com.klc.logicroute.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Shipment(
    val id: String,
    @SerialName("shipmentNumber")
    val shipmentNumber: String,
    val status: ShipmentStatus,
    @SerialName("originAddress")
    val originAddress: String,
    @SerialName("destinationAddress")
    val destinationAddress: String,
    @SerialName("originCity")
    val originCity: String = "",
    @SerialName("destinationCity")
    val destinationCity: String = "",
    @SerialName("customerName")
    val customerName: String = "",
    @SerialName("customerPhone")
    val customerPhone: String = "",
    @SerialName("weight")
    val weight: Double = 0.0,
    @SerialName("volume")
    val volume: Double = 0.0,
    @SerialName("palletCount")
    val palletCount: Int = 0,
    @SerialName("vehiclePlate")
    val vehiclePlate: String = "",
    @SerialName("driverName")
    val driverName: String = "",
    @SerialName("scheduledDate")
    val scheduledDate: String = "",
    @SerialName("originLat")
    val originLat: Double? = null,
    @SerialName("originLng")
    val originLng: Double? = null,
    @SerialName("destinationLat")
    val destinationLat: Double? = null,
    @SerialName("destinationLng")
    val destinationLng: Double? = null
)
