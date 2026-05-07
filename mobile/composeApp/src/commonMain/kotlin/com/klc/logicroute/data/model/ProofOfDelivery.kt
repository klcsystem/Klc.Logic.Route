package com.klc.logicroute.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ProofOfDelivery(
    @SerialName("shipmentId")
    val shipmentId: String,
    @SerialName("recipientName")
    val recipientName: String,
    @SerialName("notes")
    val notes: String = "",
    @SerialName("timestamp")
    val timestamp: String = ""
)
