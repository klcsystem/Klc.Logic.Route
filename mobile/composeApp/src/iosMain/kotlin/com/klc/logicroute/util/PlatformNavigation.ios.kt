package com.klc.logicroute.util

import platform.Foundation.NSURL
import platform.UIKit.UIApplication

actual class PlatformNavigation {

    actual fun openExternalMap(lat: Double, lng: Double, label: String) {
        // Try Apple Maps first
        val appleMapsUrl = "http://maps.apple.com/?daddr=$lat,$lng&dirflg=d"
        val url = NSURL.URLWithString(appleMapsUrl)
        if (url != null) {
            UIApplication.sharedApplication.openURL(url)
        }
    }

    actual fun openPhoneDialer(phoneNumber: String) {
        val url = NSURL.URLWithString("tel:$phoneNumber")
        if (url != null) {
            UIApplication.sharedApplication.openURL(url)
        }
    }
}
