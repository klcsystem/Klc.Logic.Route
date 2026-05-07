package com.klc.logicroute.di

import com.klc.logicroute.data.api.AuthApi
import com.klc.logicroute.data.api.LocationApi
import com.klc.logicroute.data.api.PodApi
import com.klc.logicroute.data.api.ShipmentApi
import com.klc.logicroute.data.api.createHttpClient
import com.klc.logicroute.data.repository.AuthRepository
import com.klc.logicroute.data.repository.PodRepository
import com.klc.logicroute.data.repository.ShipmentRepository
import com.klc.logicroute.util.ImagePicker
import com.klc.logicroute.util.LocationTracker
import com.klc.logicroute.util.PlatformNavigation
import com.klc.logicroute.util.TokenStorage
import org.koin.dsl.module

val appModule = module {
    single { TokenStorage() }
    single { PlatformNavigation() }
    single { LocationTracker() }
    single { ImagePicker() }
    single { createHttpClient(get()) }
    single { AuthApi(get()) }
    single { ShipmentApi(get()) }
    single { LocationApi(get()) }
    single { PodApi(get()) }
    single { AuthRepository(get(), get()) }
    single { ShipmentRepository(get()) }
    single { PodRepository(get()) }
}
