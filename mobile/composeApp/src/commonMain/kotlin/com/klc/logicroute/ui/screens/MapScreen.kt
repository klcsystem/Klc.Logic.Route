package com.klc.logicroute.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.klc.logicroute.data.model.Shipment
import com.klc.logicroute.data.model.ShipmentStatus
import com.klc.logicroute.ui.components.StatusBadge
import com.klc.logicroute.ui.theme.*
import com.klc.logicroute.util.GpsLocation

// Colors for each shipment polyline
private val polylineColors = listOf(
    Color(0xFFF97316), // Orange
    Color(0xFF3B82F6), // Blue
    Color(0xFF8B5CF6), // Purple
    Color(0xFFEC4899), // Pink
    Color(0xFF14B8A6), // Teal
    Color(0xFFEAB308), // Yellow
    Color(0xFF06B6D4), // Cyan
    Color(0xFFE11D48), // Rose
)

@Composable
fun MapScreen(
    shipments: List<Shipment>,
    driverLocation: GpsLocation?,
    onShipmentClick: (String) -> Unit,
    onNavigateClick: (Shipment) -> Unit,
    modifier: Modifier = Modifier
) {
    val activeShipments = remember(shipments) {
        shipments.filter {
            it.status == ShipmentStatus.Assigned ||
            it.status == ShipmentStatus.InTransit ||
            it.status == ShipmentStatus.Loaded
        }
    }

    var selectedShipment by remember { mutableStateOf<Shipment?>(null) }
    var tappedShipment by remember { mutableStateOf<Shipment?>(null) }

    Column(modifier = modifier.fillMaxSize()) {
        // Map area with shipment markers
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(Color(0xFFE8F0FE))
        ) {
            if (activeShipments.isEmpty() && driverLocation == null) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.LocationOn,
                            contentDescription = null,
                            tint = SlateTextSecondary,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "Aktif sevkiyat bulunamadi",
                            color = SlateTextSecondary,
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }
            } else {
                // Collect all points for bounds calculation
                val allLats = remember(activeShipments, driverLocation) {
                    activeShipments.flatMap {
                        listOfNotNull(it.originLat, it.destinationLat)
                    } + listOfNotNull(driverLocation?.latitude)
                }
                val allLngs = remember(activeShipments, driverLocation) {
                    activeShipments.flatMap {
                        listOfNotNull(it.originLng, it.destinationLng)
                    } + listOfNotNull(driverLocation?.longitude)
                }

                // Map marker hit areas for tap detection
                var markerHitAreas by remember { mutableStateOf<Map<String, Rect>>(emptyMap()) }

                Canvas(
                    modifier = Modifier
                        .fillMaxSize()
                        .pointerInput(activeShipments) {
                            detectTapGestures { offset ->
                                // Check if tap hits any shipment marker
                                val hitShipment = markerHitAreas.entries.find { (_, rect) ->
                                    rect.contains(offset)
                                }
                                tappedShipment = if (hitShipment != null) {
                                    activeShipments.find { it.id == hitShipment.key }
                                } else {
                                    null
                                }
                            }
                        }
                ) {
                    val width = size.width
                    val height = size.height

                    if (allLats.isNotEmpty() && allLngs.isNotEmpty()) {
                        val minLat = allLats.min()
                        val maxLat = allLats.max()
                        val minLng = allLngs.min()
                        val maxLng = allLngs.max()

                        val latRange = (maxLat - minLat).coerceAtLeast(0.01)
                        val lngRange = (maxLng - minLng).coerceAtLeast(0.01)

                        val padding = 80f

                        fun toScreenX(lng: Double): Float =
                            padding + ((lng - minLng) / lngRange * (width - 2 * padding)).toFloat()
                        fun toScreenY(lat: Double): Float =
                            height - padding - ((lat - minLat) / latRange * (height - 2 * padding)).toFloat()

                        val newHitAreas = mutableMapOf<String, Rect>()

                        // Draw polylines for each shipment
                        activeShipments.forEachIndexed { index, shipment ->
                            val color = polylineColors[index % polylineColors.size]
                            val isSelected = selectedShipment?.id == shipment.id

                            val oLat = shipment.originLat
                            val oLng = shipment.originLng
                            val dLat = shipment.destinationLat
                            val dLng = shipment.destinationLng

                            if (oLat != null && oLng != null && dLat != null && dLng != null) {
                                val startPoint = Offset(toScreenX(oLng), toScreenY(oLat))
                                val endPoint = Offset(toScreenX(dLng), toScreenY(dLat))

                                // Draw polyline
                                val path = Path().apply {
                                    moveTo(startPoint.x, startPoint.y)
                                    // Add slight curve for visual appeal
                                    val midX = (startPoint.x + endPoint.x) / 2
                                    val midY = (startPoint.y + endPoint.y) / 2 - 30f
                                    quadraticTo(midX, midY, endPoint.x, endPoint.y)
                                }

                                drawPath(
                                    path = path,
                                    color = color.copy(alpha = if (isSelected) 1f else 0.6f),
                                    style = Stroke(
                                        width = if (isSelected) 5f else 3f,
                                        cap = StrokeCap.Round,
                                        pathEffect = if (shipment.status == ShipmentStatus.Assigned) {
                                            PathEffect.dashPathEffect(floatArrayOf(15f, 10f))
                                        } else null
                                    )
                                )

                                // Origin marker (filled circle with white border)
                                drawCircle(
                                    color = Color.White,
                                    radius = 14f,
                                    center = startPoint,
                                    style = Fill
                                )
                                drawCircle(
                                    color = SuccessGreen,
                                    radius = 10f,
                                    center = startPoint,
                                    style = Fill
                                )

                                // Destination marker
                                drawCircle(
                                    color = Color.White,
                                    radius = 14f,
                                    center = endPoint,
                                    style = Fill
                                )
                                drawCircle(
                                    color = color,
                                    radius = 10f,
                                    center = endPoint,
                                    style = Fill
                                )

                                // Hit area for destination (larger tap target)
                                newHitAreas[shipment.id] = Rect(
                                    left = endPoint.x - 30f,
                                    top = endPoint.y - 30f,
                                    right = endPoint.x + 30f,
                                    bottom = endPoint.y + 30f
                                )
                            }
                        }

                        // Draw driver location marker
                        if (driverLocation != null) {
                            val driverPoint = Offset(
                                toScreenX(driverLocation.longitude),
                                toScreenY(driverLocation.latitude)
                            )

                            // Pulsing outer circle
                            drawCircle(
                                color = Color(0xFF3B82F6).copy(alpha = 0.2f),
                                radius = 24f,
                                center = driverPoint,
                                style = Fill
                            )
                            // White border
                            drawCircle(
                                color = Color.White,
                                radius = 14f,
                                center = driverPoint,
                                style = Fill
                            )
                            // Blue dot
                            drawCircle(
                                color = Color(0xFF3B82F6),
                                radius = 10f,
                                center = driverPoint,
                                style = Fill
                            )
                            // Inner white dot
                            drawCircle(
                                color = Color.White,
                                radius = 4f,
                                center = driverPoint,
                                style = Fill
                            )
                        }

                        markerHitAreas = newHitAreas
                    }
                }

                // Legend
                Column(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(12.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.95f))
                        .padding(8.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier.size(10.dp).clip(CircleShape).background(SuccessGreen)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text("Cikis", style = MaterialTheme.typography.labelSmall)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier.size(10.dp).clip(CircleShape).background(Orange500)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text("Varis", style = MaterialTheme.typography.labelSmall)
                    }
                    if (driverLocation != null) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier.size(10.dp).clip(CircleShape).background(InfoBlue)
                            )
                            Spacer(Modifier.width(4.dp))
                            Text("Konumum", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }

                // Shipment popup on tap
                if (tappedShipment != null) {
                    ShipmentPopup(
                        shipment = tappedShipment!!,
                        onDismiss = { tappedShipment = null },
                        onDetailClick = {
                            onShipmentClick(tappedShipment!!.id)
                            tappedShipment = null
                        },
                        onNavigateClick = {
                            onNavigateClick(tappedShipment!!)
                            tappedShipment = null
                        },
                        modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp)
                    )
                }
            }
        }

        // Active shipments list at bottom
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(modifier = Modifier.padding(top = 12.dp)) {
                Text(
                    text = "Aktif Sevkiyatlar (${activeShipments.size})",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )

                Spacer(Modifier.height(8.dp))

                LazyColumn(
                    modifier = Modifier.heightIn(max = 200.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(activeShipments, key = { it.id }) { shipment ->
                        val index = activeShipments.indexOf(shipment)
                        MapShipmentItem(
                            shipment = shipment,
                            color = polylineColors[index % polylineColors.size],
                            isSelected = selectedShipment?.id == shipment.id,
                            onClick = {
                                selectedShipment = if (selectedShipment?.id == shipment.id) null else shipment
                            },
                            onNavigateClick = { onNavigateClick(shipment) }
                        )
                    }
                }

                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

@Composable
private fun ShipmentPopup(
    shipment: Shipment,
    onDismiss: () -> Unit,
    onDetailClick: () -> Unit,
    onNavigateClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = shipment.shipmentNumber,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    StatusBadge(status = shipment.status)
                }
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Kapat", modifier = Modifier.size(16.dp))
                }
            }

            Text(
                text = "${shipment.originCity} \u2192 ${shipment.destinationCity}",
                style = MaterialTheme.typography.bodyMedium,
                color = SlateTextSecondary
            )

            if (shipment.customerName.isNotBlank()) {
                Text(
                    text = "Musteri: ${shipment.customerName}",
                    style = MaterialTheme.typography.bodySmall,
                    color = SlateTextSecondary
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onDetailClick,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Detay")
                }
                Button(
                    onClick = onNavigateClick,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Navigasyon")
                }
            }
        }
    }
}

@Composable
private fun MapShipmentItem(
    shipment: Shipment,
    color: Color,
    isSelected: Boolean,
    onClick: () -> Unit,
    onNavigateClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(
                if (isSelected) Orange50 else MaterialTheme.colorScheme.surface
            )
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Color indicator
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )

        Column(modifier = Modifier.weight(1f)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = shipment.shipmentNumber,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )
                StatusBadge(status = shipment.status)
            }
            Text(
                text = "${shipment.originCity} \u2192 ${shipment.destinationCity}",
                style = MaterialTheme.typography.bodySmall,
                color = SlateTextSecondary
            )
        }

        IconButton(onClick = onNavigateClick) {
            Icon(
                Icons.Default.LocationOn,
                contentDescription = "Navigasyon",
                tint = Orange500
            )
        }
    }
}
