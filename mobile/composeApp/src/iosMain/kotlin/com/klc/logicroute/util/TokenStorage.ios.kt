package com.klc.logicroute.util

import platform.Foundation.NSUserDefaults

actual class TokenStorage {
    private val defaults = NSUserDefaults.standardUserDefaults

    actual suspend fun saveToken(token: String) {
        defaults.setObject(token, forKey = "jwt_token")
    }

    actual suspend fun getToken(): String? {
        return defaults.stringForKey("jwt_token")
    }

    actual suspend fun saveUserId(userId: String) {
        defaults.setObject(userId, forKey = "user_id")
    }

    actual suspend fun getUserId(): String? {
        return defaults.stringForKey("user_id")
    }

    actual suspend fun saveUserName(name: String) {
        defaults.setObject(name, forKey = "user_name")
    }

    actual suspend fun getUserName(): String? {
        return defaults.stringForKey("user_name")
    }

    actual suspend fun saveUserEmail(email: String) {
        defaults.setObject(email, forKey = "user_email")
    }

    actual suspend fun getUserEmail(): String? {
        return defaults.stringForKey("user_email")
    }

    actual suspend fun clear() {
        defaults.removeObjectForKey("jwt_token")
        defaults.removeObjectForKey("user_id")
        defaults.removeObjectForKey("user_name")
        defaults.removeObjectForKey("user_email")
    }
}
