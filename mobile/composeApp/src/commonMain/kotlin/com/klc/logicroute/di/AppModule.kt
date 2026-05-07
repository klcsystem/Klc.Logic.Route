package com.klc.logicroute.di

import com.klc.logicroute.data.api.AuthApi
import com.klc.logicroute.data.api.LocationApi
import com.klc.logicroute.data.api.PodApi
import com.klc.logicroute.data.api.ShipmentApi
import com.klc.logicroute.data.api.createHttpClient
import com.klc.logicroute.data.local.OfflineQueue
import com.klc.logicroute.data.local.SyncManager
import com.klc.logicroute.data.repository.AuthRepository
import com.klc.logicroute.data.repository.PodRepository
import com.klc.logicroute.data.repository.ShipmentRepository
import com.klc.logicroute.service.LocationService
import com.klc.logicroute.util.ImagePicker
import com.klc.logicroute.util.LocationTracker
import com.klc.logicroute.util.PlatformNavigation
import com.klc.logicroute.util.TokenStorage
import org.koin.dsl.module

val appModule = module {
    // Platform
    single { TokenStorage() }
    single { PlatformNavigation() }
    single { LocationTracker() }
    single { ImagePicker() }

    // Network
    single { createHttpClient(get()) }
    single { AuthApi(get()) }
    single { ShipmentApi(get()) }
    single { LocationApi(get()) }
    single { PodApi(get()) }

    // Repositories
    single { AuthRepository(get(), get()) }
    single { ShipmentRepository(get()) }
    single { PodRepository(get()) }

    // Offline & Sync
    single { OfflineQueue() }
    single { SyncManager(get(), get(), get(), get()) }

    // Services
    single { LocationService(get(), get(), get(), get()) }
}
