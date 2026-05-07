package com.klc.logicroute.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klc.logicroute.data.model.Shipment
import com.klc.logicroute.data.model.ShipmentStatus
import com.klc.logicroute.ui.components.StatusBadge
import com.klc.logicroute.ui.theme.*

@Composable
fun MapScreen(
    shipments: List<Shipment>,
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

    Column(modifier = modifier.fillMaxSize()) {
        // Map area with shipment markers visualization
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(Color(0xFFE8F0FE))
        ) {
            // Simple map visualization showing shipment dots
            if (activeShipments.isEmpty()) {
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
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val width = size.width
                    val height = size.height

                    // Calculate bounds from shipment coordinates
                    val lats = activeShipments.flatMap {
                        listOfNotNull(it.originLat, it.destinationLat)
                    }
                    val lngs = activeShipments.flatMap {
                        listOfNotNull(it.originLng, it.destinationLng)
                    }

                    if (lats.isNotEmpty() && lngs.isNotEmpty()) {
                        val minLat = lats.min()
                        val maxLat = lats.max()
                        val minLng = lngs.min()
                        val maxLng = lngs.max()

                        val latRange = (maxLat - minLat).coerceAtLeast(0.01)
                        val lngRange = (maxLng - minLng).coerceAtLeast(0.01)

                        val padding = 60f

                        fun toScreenX(lng: Double): Float =
                            padding + ((lng - minLng) / lngRange * (width - 2 * padding)).toFloat()
                        fun toScreenY(lat: Double): Float =
                            height - padding - ((lat - minLat) / latRange * (height - 2 * padding)).toFloat()

                        activeShipments.forEach { shipment ->
                            // Draw origin (green dot)
                            shipment.originLat?.let { lat ->
                                shipment.originLng?.let { lng ->
                                    drawCircle(
                                        color = Color(0xFF22C55E),
                                        radius = 12f,
                                        center = Offset(toScreenX(lng), toScreenY(lat)),
                                        style = Fill
                                    )
                                }
                            }

                            // Draw destination (red dot)
                            shipment.destinationLat?.let { lat ->
                                shipment.destinationLng?.let { lng ->
                                    drawCircle(
                                        color = Color(0xFFEF4444),
                                        radius = 12f,
                                        center = Offset(toScreenX(lng), toScreenY(lat)),
                                        style = Fill
                                    )
                                }
                            }

                            // Draw line between origin and destination
                            val oLat = shipment.originLat
                            val oLng = shipment.originLng
                            val dLat = shipment.destinationLat
                            val dLng = shipment.destinationLng
                            if (oLat != null && oLng != null && dLat != null && dLng != null) {
                                drawLine(
                                    color = Color(0xFFF97316).copy(alpha = 0.6f),
                                    start = Offset(toScreenX(oLng), toScreenY(oLat)),
                                    end = Offset(toScreenX(dLng), toScreenY(dLat)),
                                    strokeWidth = 3f
                                )
                            }
                        }
                    }
                }

                // Legend
                Row(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(12.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.9f))
                        .padding(8.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(SuccessGreen)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text("Cikis", style = MaterialTheme.typography.labelSmall)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(ErrorRed)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text("Varis", style = MaterialTheme.typography.labelSmall)
                    }
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
                        MapShipmentItem(
                            shipment = shipment,
                            isSelected = selectedShipment?.id == shipment.id,
                            onClick = {
                                selectedShipment = shipment
                                onShipmentClick(shipment.id)
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
private fun MapShipmentItem(
    shipment: Shipment,
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
                text = "${shipment.originCity} → ${shipment.destinationCity}",
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
