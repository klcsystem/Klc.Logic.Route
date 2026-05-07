package com.klc.logicroute.service

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow

data class PushNotification(
    val title: String,
    val body: String,
    val shipmentId: String? = null,
    val type: NotificationType = NotificationType.General
)

enum class NotificationType {
    General,
    NewShipment,
    StatusChange,
    Alert
}

object PushNotificationHandler {
    private val _notifications = MutableSharedFlow<PushNotification>(extraBufferCapacity = 10)
    val notifications: SharedFlow<PushNotification> = _notifications

    fun onNotificationReceived(title: String, body: String, data: Map<String, String>) {
        val type = when (data["type"]) {
            "new_shipment" -> NotificationType.NewShipment
            "status_change" -> NotificationType.StatusChange
            "alert" -> NotificationType.Alert
            else -> NotificationType.General
        }
        _notifications.tryEmit(
            PushNotification(
                title = title,
                body = body,
                shipmentId = data["shipmentId"],
                type = type
            )
        )
    }
}
