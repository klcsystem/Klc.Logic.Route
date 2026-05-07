package com.klc.logicroute.data.api

import com.klc.logicroute.data.model.LocationBatchRequest
import com.klc.logicroute.data.model.LocationUpdate
import io.ktor.client.HttpClient
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class LocationApi(private val client: HttpClient) {

    suspend fun sendLocations(locations: List<LocationUpdate>) {
        client.post("mobile/location") {
            setBody(LocationBatchRequest(locations = locations))
        }
    }
}
