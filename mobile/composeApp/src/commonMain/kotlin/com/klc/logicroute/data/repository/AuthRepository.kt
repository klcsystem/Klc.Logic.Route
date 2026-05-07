package com.klc.logicroute.data.repository

import com.klc.logicroute.data.api.AuthApi
import com.klc.logicroute.data.model.LoginResponse
import com.klc.logicroute.util.TokenStorage

class AuthRepository(
    private val authApi: AuthApi,
    private val tokenStorage: TokenStorage
) {
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            val response = authApi.login(email, password)
            tokenStorage.saveToken(response.token)
            tokenStorage.saveUserId(response.userId)
            tokenStorage.saveUserName(response.fullName)
            tokenStorage.saveUserEmail(response.email)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        tokenStorage.clear()
    }

    suspend fun isLoggedIn(): Boolean {
        return tokenStorage.getToken() != null
    }

    suspend fun getUserId(): String? = tokenStorage.getUserId()
    suspend fun getUserName(): String? = tokenStorage.getUserName()
    suspend fun getUserEmail(): String? = tokenStorage.getUserEmail()
}
