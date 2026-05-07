package com.klc.logicroute.util

expect class TokenStorage() {
    suspend fun saveToken(token: String)
    suspend fun getToken(): String?
    suspend fun saveUserId(userId: String)
    suspend fun getUserId(): String?
    suspend fun saveUserName(name: String)
    suspend fun getUserName(): String?
    suspend fun saveUserEmail(email: String)
    suspend fun getUserEmail(): String?
    suspend fun clear()
}
