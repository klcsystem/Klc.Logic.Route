package com.klc.logicroute

import androidx.compose.runtime.Composable
import com.klc.logicroute.di.appModule
import com.klc.logicroute.ui.navigation.AppNavigation
import com.klc.logicroute.ui.theme.LogicRouteTheme
import org.koin.compose.KoinApplication

@Composable
fun App() {
    KoinApplication(application = {
        modules(appModule)
    }) {
        LogicRouteTheme {
            AppNavigation()
        }
    }
}
