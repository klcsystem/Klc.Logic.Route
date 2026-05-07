package com.klc.logicroute.util

expect class PlatformNavigation() {
    fun openExternalMap(lat: Double, lng: Double, label: String)
    fun openPhoneDialer(phoneNumber: String)
}
