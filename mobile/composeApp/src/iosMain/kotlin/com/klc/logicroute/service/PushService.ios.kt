package com.klc.logicroute.service

/**
 * Apple Push Notification service for iOS.
 *
 * In production, push notification registration would be handled in the Swift AppDelegate:
 *
 * func application(_ application: UIApplication,
 *     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
 *     let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
 *     // Send token to backend: POST /api/mobile/devices
 * }
 *
 * func application(_ application: UIApplication,
 *     didReceiveRemoteNotification userInfo: [AnyHashable: Any]) {
 *     // Forward to Kotlin handler
 *     PushNotificationHandler.shared.onNotificationReceived(userInfo)
 * }
 *
 * The notification payload from the backend should follow APNs format:
 * {
 *   "aps": { "alert": { "title": "...", "body": "..." } },
 *   "shipmentId": "...",
 *   "type": "new_shipment"
 * }
 */
class IosPushService {
    fun requestPermission() {
        // UNUserNotificationCenter.current().requestAuthorization(
        //     options: [.alert, .badge, .sound]
        // )
        // UIApplication.shared.registerForRemoteNotifications()
    }
}
