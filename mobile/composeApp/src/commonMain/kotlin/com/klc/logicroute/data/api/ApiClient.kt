package com.klc.logicroute.data.api

import com.klc.logicroute.util.TokenStorage
import io.ktor.client.HttpClient
import io.ktor.client.plugins.auth.Auth
import io.ktor.client.plugins.auth.providers.BearerTokens
import io.ktor.client.plugins.auth.providers.bearer
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

object ApiConfig {
    const val BASE_URL = "https://logicroute.klcsystem.com/api"
}

fun createHttpClient(tokenStorage: TokenStorage): HttpClient {
    return HttpClient {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
                prettyPrint = false
                encodeDefaults = true
            })
        }

        install(Logging) {
            level = LogLevel.BODY
        }

        install(Auth) {
            bearer {
                loadTokens {
                    val token = tokenStorage.getToken()
                    if (token != null) {
                        BearerTokens(token, "")
                    } else {
                        null
                    }
                }
            }
        }

        defaultRequest {
            url(ApiConfig.BASE_URL + "/")
            contentType(ContentType.Application.Json)
        }
    }
}
