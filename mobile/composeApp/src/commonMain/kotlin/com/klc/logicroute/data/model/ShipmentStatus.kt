package com.klc.logicroute.data.model

import kotlinx.serialization.Serializable

@Serializable
enum class ShipmentStatus {
    Assigned,
    Loaded,
    InTransit,
    Delivered,
    Cancelled;

    fun displayName(): String = when (this) {
        Assigned -> "Atandı"
        Loaded -> "Yüklendi"
        InTransit -> "Yolda"
        Delivered -> "Teslim Edildi"
        Cancelled -> "İptal"
    }
}
