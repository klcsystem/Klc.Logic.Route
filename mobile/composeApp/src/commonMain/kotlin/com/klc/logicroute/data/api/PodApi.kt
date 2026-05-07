package com.klc.logicroute.data.api

import io.ktor.client.HttpClient
import io.ktor.client.request.forms.formData
import io.ktor.client.request.forms.submitFormWithBinaryData
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders

class PodApi(private val client: HttpClient) {

    suspend fun uploadProofOfDelivery(
        shipmentId: String,
        recipientName: String,
        notes: String,
        photoBytes: ByteArray?
    ) {
        client.submitFormWithBinaryData(
            url = "mobile/shipments/$shipmentId/pod",
            formData = formData {
                append("recipientName", recipientName)
                append("notes", notes)
                if (photoBytes != null) {
                    append("photo", photoBytes, Headers.build {
                        append(HttpHeaders.ContentType, "image/jpeg")
                        append(HttpHeaders.ContentDisposition, "filename=\"pod_$shipmentId.jpg\"")
                    })
                }
            }
        )
    }
}
