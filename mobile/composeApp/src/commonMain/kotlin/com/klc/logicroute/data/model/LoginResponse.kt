package com.klc.logicroute.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LoginResponse(
    val token: String,
    @SerialName("userId")
    val userId: String,
    @SerialName("fullName")
    val fullName: String,
    val email: String,
    val role: String
)
