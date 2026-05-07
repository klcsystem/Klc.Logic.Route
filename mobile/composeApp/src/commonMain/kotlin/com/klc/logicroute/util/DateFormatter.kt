package com.klc.logicroute.util

object DateFormatter {
    fun formatDate(isoDate: String): String {
        if (isoDate.isBlank()) return ""
        return try {
            val datePart = isoDate.substringBefore("T")
            val parts = datePart.split("-")
            if (parts.size == 3) {
                "${parts[2]}.${parts[1]}.${parts[0]}"
            } else {
                isoDate
            }
        } catch (_: Exception) {
            isoDate
        }
    }

    fun formatDateTime(isoDate: String): String {
        if (isoDate.isBlank()) return ""
        return try {
            val datePart = isoDate.substringBefore("T")
            val timePart = isoDate.substringAfter("T").substringBefore(".")
                .substringBefore("Z").take(5)
            val parts = datePart.split("-")
            if (parts.size == 3) {
                "${parts[2]}.${parts[1]}.${parts[0]} $timePart"
            } else {
                isoDate
            }
        } catch (_: Exception) {
            isoDate
        }
    }
}
