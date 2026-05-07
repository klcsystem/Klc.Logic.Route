package com.klc.logicroute.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Alignment
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.klc.logicroute.data.local.OfflineQueue
import com.klc.logicroute.data.local.SyncManager
import com.klc.logicroute.data.model.Shipment
import com.klc.logicroute.data.model.ShipmentStatus
import com.klc.logicroute.data.repository.AuthRepository
import com.klc.logicroute.data.repository.PodRepository
import com.klc.logicroute.data.repository.ShipmentRepository
import com.klc.logicroute.service.LocationService
import com.klc.logicroute.ui.components.LogicRouteTopBar
import com.klc.logicroute.ui.components.SignatureLine
import com.klc.logicroute.ui.screens.*
import com.klc.logicroute.util.ImagePicker
import com.klc.logicroute.util.PlatformNavigation
import kotlinx.coroutines.launch
import org.koin.compose.koinInject

sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object ShipmentList : Screen("shipments")
    data object ShipmentDetail : Screen("shipments/{id}") {
        fun createRoute(id: String) = "shipments/$id"
    }
    data object DeliveryConfirm : Screen("delivery/{id}") {
        fun createRoute(id: String) = "delivery/$id"
    }
    data object Settings : Screen("settings")
}

data class BottomNavItem(
    val label: String,
    val icon: ImageVector,
    val route: String
)

val bottomNavItems = listOf(
    BottomNavItem("Sevkiyatlar", Icons.Default.Home, Screen.ShipmentList.route),
    BottomNavItem("Harita", Icons.Default.LocationOn, "map"),
    BottomNavItem("Ayarlar", Icons.Default.Settings, Screen.Settings.route)
)

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val authRepository: AuthRepository = koinInject()
    val shipmentRepository: ShipmentRepository = koinInject()
    val podRepository: PodRepository = koinInject()
    val imagePicker: ImagePicker = koinInject()
    val platformNavigation: PlatformNavigation = koinInject()
    val locationService: LocationService = koinInject()
    val offlineQueue: OfflineQueue = koinInject()
    val syncManager: SyncManager = koinInject()
    val scope = rememberCoroutineScope()

    // Auth state
    var isLoggedIn by remember { mutableStateOf<Boolean?>(null) }
    var userName by remember { mutableStateOf("") }
    var userEmail by remember { mutableStateOf("") }

    // Shipments state
    var shipments by remember { mutableStateOf<List<Shipment>>(emptyList()) }
    var isLoadingShipments by remember { mutableStateOf(false) }
    var selectedShipment by remember { mutableStateOf<Shipment?>(null) }
    var isLoadingDetail by remember { mutableStateOf(false) }

    // Delivery confirmation state
    var podPhotoBytes by remember { mutableStateOf<ByteArray?>(null) }
    var signatureLines by remember { mutableStateOf<List<SignatureLine>>(emptyList()) }
    var isPodUploading by remember { mutableStateOf(false) }
    var isPodSuccess by remember { mutableStateOf(false) }
    var podError by remember { mutableStateOf<String?>(null) }

    // Location tracking state
    val driverLocation by locationService.currentLocation.collectAsState()
    val pendingCount by syncManager.pendingCount.collectAsState()

    // Check login state
    LaunchedEffect(Unit) {
        isLoggedIn = authRepository.isLoggedIn()
        if (isLoggedIn == true) {
            userName = authRepository.getUserName() ?: ""
            userEmail = authRepository.getUserEmail() ?: ""
            syncManager.startSync()
        }
    }

    fun loadShipments() {
        scope.launch {
            isLoadingShipments = true
            val userId = authRepository.getUserId() ?: return@launch
            shipmentRepository.getShipments(userId).fold(
                onSuccess = { shipments = it },
                onFailure = { /* handle error */ }
            )
            isLoadingShipments = false
        }
    }

    fun loadShipmentDetail(id: String) {
        scope.launch {
            isLoadingDetail = true
            shipmentRepository.getShipment(id).fold(
                onSuccess = { selectedShipment = it },
                onFailure = { /* handle error */ }
            )
            isLoadingDetail = false
        }
    }

    fun handleStatusUpdate(shipmentId: String, status: ShipmentStatus) {
        scope.launch {
            shipmentRepository.updateStatus(shipmentId, status).fold(
                onSuccess = { updated ->
                    selectedShipment = updated
                    shipments = shipments.map {
                        if (it.id == updated.id) updated else it
                    }
                },
                onFailure = {
                    // Save to offline queue
                    offlineQueue.enqueueStatusUpdate(shipmentId, status)
                }
            )
        }
    }

    fun navigateToDeliveryConfirm(shipment: Shipment) {
        podPhotoBytes = null
        signatureLines = emptyList()
        podError = null
        isPodSuccess = false
        navController.navigate(Screen.DeliveryConfirm.createRoute(shipment.id))
    }

    val startDestination = when (isLoggedIn) {
        true -> Screen.ShipmentList.route
        false -> Screen.Login.route
        null -> Screen.Login.route
    }

    if (isLoggedIn == null) return

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val showBottomBar = currentRoute in listOf(
        Screen.ShipmentList.route,
        "map",
        Screen.Settings.route
    )

    val topBarTitle = when (currentRoute) {
        Screen.ShipmentList.route -> "Sevkiyatlar"
        Screen.ShipmentDetail.route -> selectedShipment?.shipmentNumber ?: "Detay"
        Screen.DeliveryConfirm.route -> "Teslimat Onay"
        Screen.Settings.route -> "Ayarlar"
        "map" -> "Harita"
        else -> ""
    }

    val showBackButton = currentRoute == Screen.ShipmentDetail.route ||
            currentRoute == Screen.DeliveryConfirm.route

    Scaffold(
        topBar = {
            if (currentRoute != Screen.Login.route) {
                LogicRouteTopBar(
                    title = topBarTitle,
                    showBackButton = showBackButton,
                    onBackClick = { navController.popBackStack() }
                )
            }
        },
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomNavItems.forEach { item ->
                        NavigationBarItem(
                            selected = currentRoute == item.route,
                            onClick = {
                                if (currentRoute != item.route) {
                                    navController.navigate(item.route) {
                                        popUpTo(Screen.ShipmentList.route) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            icon = {
                                if (item.route == Screen.Settings.route && pendingCount > 0) {
                                    BadgedBox(badge = {
                                        Badge { Text("$pendingCount") }
                                    }) {
                                        Icon(item.icon, contentDescription = item.label)
                                    }
                                } else {
                                    Icon(item.icon, contentDescription = item.label)
                                }
                            },
                            label = { Text(item.label) }
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(Screen.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        scope.launch {
                            userName = authRepository.getUserName() ?: ""
                            userEmail = authRepository.getUserEmail() ?: ""
                            syncManager.startSync()
                        }
                        navController.navigate(Screen.ShipmentList.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                        loadShipments()
                    },
                    loginAction = { email, password ->
                        authRepository.login(email, password)
                    }
                )
            }

            composable(Screen.ShipmentList.route) {
                LaunchedEffect(Unit) {
                    if (shipments.isEmpty()) loadShipments()
                }
                ShipmentListScreen(
                    shipments = shipments,
                    isLoading = isLoadingShipments,
                    onRefresh = { loadShipments() },
                    onShipmentClick = { id ->
                        loadShipmentDetail(id)
                        navController.navigate(Screen.ShipmentDetail.createRoute(id))
                    }
                )
            }

            composable(Screen.ShipmentDetail.route) {
                ShipmentDetailScreen(
                    shipment = selectedShipment,
                    isLoading = isLoadingDetail,
                    onStatusUpdate = { status ->
                        val shipmentId = selectedShipment?.id ?: return@ShipmentDetailScreen
                        handleStatusUpdate(shipmentId, status)
                    },
                    onDeliveredWithPod = { shipment ->
                        // Update status to Delivered, then open delivery confirm
                        handleStatusUpdate(shipment.id, ShipmentStatus.Delivered)
                        navigateToDeliveryConfirm(shipment)
                    },
                    onNavigateClick = { shipment ->
                        val lat = shipment.destinationLat ?: return@ShipmentDetailScreen
                        val lng = shipment.destinationLng ?: return@ShipmentDetailScreen
                        platformNavigation.openExternalMap(lat, lng, shipment.destinationAddress)
                    },
                    onCallClick = { phone ->
                        platformNavigation.openPhoneDialer(phone)
                    },
                    onPodClick = { shipment ->
                        navigateToDeliveryConfirm(shipment)
                    }
                )
            }

            composable("map") {
                LaunchedEffect(Unit) {
                    if (shipments.isEmpty()) loadShipments()
                }
                MapScreen(
                    shipments = shipments,
                    driverLocation = driverLocation,
                    onShipmentClick = { id ->
                        loadShipmentDetail(id)
                        navController.navigate(Screen.ShipmentDetail.createRoute(id))
                    },
                    onNavigateClick = { shipment ->
                        val lat = shipment.destinationLat ?: return@MapScreen
                        val lng = shipment.destinationLng ?: return@MapScreen
                        platformNavigation.openExternalMap(lat, lng, shipment.destinationAddress)
                    }
                )
            }

            composable(Screen.DeliveryConfirm.route) {
                DeliveryConfirmScreen(
                    shipment = selectedShipment,
                    onTakePhoto = {
                        scope.launch {
                            podPhotoBytes = imagePicker.takePhoto()
                        }
                    },
                    onPickPhoto = {
                        scope.launch {
                            podPhotoBytes = imagePicker.pickImage()
                        }
                    },
                    hasPhoto = podPhotoBytes != null,
                    onRemovePhoto = { podPhotoBytes = null },
                    signatureLines = signatureLines,
                    onSignatureLinesChange = { signatureLines = it },
                    onClearSignature = { signatureLines = emptyList() },
                    onSubmit = { recipientName, notes ->
                        val shipmentId = selectedShipment?.id ?: return@DeliveryConfirmScreen
                        scope.launch {
                            isPodUploading = true
                            podError = null
                            podRepository.uploadProofOfDelivery(
                                shipmentId = shipmentId,
                                recipientName = recipientName,
                                notes = notes,
                                photoBytes = podPhotoBytes
                            ).fold(
                                onSuccess = {
                                    isPodUploading = false
                                    isPodSuccess = true
                                },
                                onFailure = { e ->
                                    // Try offline queue
                                    offlineQueue.enqueuePod(
                                        shipmentId = shipmentId,
                                        recipientName = recipientName,
                                        notes = notes,
                                        photoBytes = podPhotoBytes,
                                        signatureBytes = null
                                    )
                                    isPodUploading = false
                                    isPodSuccess = true // Consider it queued successfully
                                }
                            )
                        }
                    },
                    isUploading = isPodUploading,
                    isSuccess = isPodSuccess,
                    error = podError,
                    onDismissSuccess = {
                        isPodSuccess = false
                        podPhotoBytes = null
                        signatureLines = emptyList()
                        navController.popBackStack()
                        // Refresh shipments
                        loadShipments()
                    }
                )
            }

            composable(Screen.Settings.route) {
                SettingsScreen(
                    userName = userName,
                    userEmail = userEmail,
                    onLogout = {
                        scope.launch {
                            locationService.stopTracking()
                            syncManager.stopSync()
                            authRepository.logout()
                            navController.navigate(Screen.Login.route) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    }
                )
            }
        }
    }
}
