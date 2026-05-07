package com.klc.logicroute.util

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import okio.Path.Companion.toPath

private const val DATA_STORE_FILE_NAME = "logicroute_prefs.preferences_pb"

private val TOKEN_KEY = stringPreferencesKey("jwt_token")
private val USER_ID_KEY = stringPreferencesKey("user_id")
private val USER_NAME_KEY = stringPreferencesKey("user_name")
private val USER_EMAIL_KEY = stringPreferencesKey("user_email")

actual class TokenStorage {
    private val dataStore: DataStore<Preferences> = PreferenceDataStoreFactory.createWithPath(
        produceFile = { DATA_STORE_FILE_NAME.toPath() }
    )

    actual suspend fun saveToken(token: String) {
        dataStore.edit { it[TOKEN_KEY] = token }
    }

    actual suspend fun getToken(): String? {
        return dataStore.data.map { it[TOKEN_KEY] }.firstOrNull()
    }

    actual suspend fun saveUserId(userId: String) {
        dataStore.edit { it[USER_ID_KEY] = userId }
    }

    actual suspend fun getUserId(): String? {
        return dataStore.data.map { it[USER_ID_KEY] }.firstOrNull()
    }

    actual suspend fun saveUserName(name: String) {
        dataStore.edit { it[USER_NAME_KEY] = name }
    }

    actual suspend fun getUserName(): String? {
        return dataStore.data.map { it[USER_NAME_KEY] }.firstOrNull()
    }

    actual suspend fun saveUserEmail(email: String) {
        dataStore.edit { it[USER_EMAIL_KEY] = email }
    }

    actual suspend fun getUserEmail(): String? {
        return dataStore.data.map { it[USER_EMAIL_KEY] }.firstOrNull()
    }

    actual suspend fun clear() {
        dataStore.edit { it.clear() }
    }
}
