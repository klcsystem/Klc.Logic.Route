package com.klc.logicroute.util

import android.content.Context
import android.content.Intent
import android.net.Uri

actual class PlatformNavigation {
    private var context: Context? = null

    fun setContext(context: Context) {
        this.context = context
    }

    actual fun openExternalMap(lat: Double, lng: Double, label: String) {
        val ctx = context ?: return
        val encodedLabel = Uri.encode(label)
        val gmmIntentUri = Uri.parse("geo:$lat,$lng?q=$lat,$lng($encodedLabel)")
        val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri).apply {
            setPackage("com.google.android.apps.maps")
        }
        if (mapIntent.resolveActivity(ctx.packageManager) != null) {
            ctx.startActivity(mapIntent)
        } else {
            val browserUri = Uri.parse(
                "https://www.google.com/maps/search/?api=1&query=$lat,$lng"
            )
            ctx.startActivity(Intent(Intent.ACTION_VIEW, browserUri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
        }
    }

    actual fun openPhoneDialer(phoneNumber: String) {
        val ctx = context ?: return
        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phoneNumber"))
        ctx.startActivity(intent)
    }
}
