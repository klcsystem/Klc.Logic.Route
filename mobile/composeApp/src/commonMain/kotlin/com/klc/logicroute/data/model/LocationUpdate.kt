package com.klc.logicroute.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LocationUpdate(
    @SerialName("driverId")
    val driverId: String,
    val latitude: Double,
    val longitude: Double,
    val speed: Double = 0.0,
    val heading: Double = 0.0,
    val accuracy: Double = 0.0,
    val timestamp: String
)

@Serializable
data class LocationBatchRequest(
    val locations: List<LocationUpdate>
)
