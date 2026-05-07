package com.klc.logicroute.data.api

import com.klc.logicroute.data.model.LoginRequest
import com.klc.logicroute.data.model.LoginResponse
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class AuthApi(private val client: HttpClient) {

    suspend fun login(email: String, password: String): LoginResponse {
        return client.post("mobile/auth/login") {
            setBody(LoginRequest(email = email, password = password))
        }.body()
    }
}
