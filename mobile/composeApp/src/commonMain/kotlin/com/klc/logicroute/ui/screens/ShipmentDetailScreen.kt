package com.klc.logicroute.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.klc.logicroute.data.model.Shipment
import com.klc.logicroute.data.model.ShipmentStatus
import com.klc.logicroute.ui.components.LoadingIndicator
import com.klc.logicroute.ui.components.StatusBadge
import com.klc.logicroute.ui.theme.*
import com.klc.logicroute.util.DateFormatter

@Composable
fun ShipmentDetailScreen(
    shipment: Shipment?,
    isLoading: Boolean,
    onStatusUpdate: (ShipmentStatus) -> Unit,
    onNavigateClick: (Shipment) -> Unit,
    onCallClick: (String) -> Unit,
    onPodClick: (Shipment) -> Unit = {},
    modifier: Modifier = Modifier
) {
    if (isLoading || shipment == null) {
        LoadingIndicator(modifier = modifier)
        return
    }

    var showStatusDialog by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Status Timeline
        StatusTimeline(currentStatus = shipment.status)

        // Shipment Info Card
        Card(
            shape = RoundedCornerShape(12.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = shipment.shipmentNumber,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    StatusBadge(status = shipment.status)
                }

                if (shipment.scheduledDate.isNotBlank()) {
                    Text(
                        text = "Tarih: ${DateFormatter.formatDate(shipment.scheduledDate)}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = SlateTextSecondary
                    )
                }
            }
        }

        // Route Card
        Card(
            shape = RoundedCornerShape(12.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Rota",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = SuccessGreen,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Column {
                        Text("Cikis", style = MaterialTheme.typography.labelMedium, color = SlateTextSecondary)
                        Text(shipment.originAddress, style = MaterialTheme.typography.bodyMedium)
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(start = 28.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = ErrorRed,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Column {
                        Text("Varis", style = MaterialTheme.typography.labelMedium, color = SlateTextSecondary)
                        Text(shipment.destinationAddress, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }

        // Customer Card
        if (shipment.customerName.isNotBlank()) {
            Card(
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Musteri",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.Person,
                                contentDescription = null,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(shipment.customerName, style = MaterialTheme.typography.bodyMedium)
                        }

                        if (shipment.customerPhone.isNotBlank()) {
                            IconButton(onClick = { onCallClick(shipment.customerPhone) }) {
                                Icon(
                                    Icons.Default.Call,
                                    contentDescription = "Ara",
                                    tint = Orange500
                                )
                            }
                        }
                    }
                }
            }
        }

        // Cargo Details Card
        Card(
            shape = RoundedCornerShape(12.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Yuk Detaylari",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    DetailItem(label = "Agirlik", value = "${shipment.weight} kg")
                    DetailItem(label = "Hacim", value = "${shipment.volume} m\u00B3")
                    DetailItem(label = "Palet", value = "${shipment.palletCount}")
                }

                if (shipment.vehiclePlate.isNotBlank()) {
                    HorizontalDivider()
                    Row {
                        Text("Arac: ", style = MaterialTheme.typography.bodyMedium, color = SlateTextSecondary)
                        Text(shipment.vehiclePlate, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                    }
                }
            }
        }

        // Action Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = { showStatusDialog = true },
                modifier = Modifier.weight(1f).height(48.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Durumu Guncelle")
            }

            OutlinedButton(
                onClick = { onNavigateClick(shipment) },
                modifier = Modifier.weight(1f).height(48.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(4.dp))
                Text("Navigasyon")
            }
        }

        // Proof of Delivery Button
        Button(
            onClick = { onPodClick(shipment) },
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = SuccessGreen
            )
        ) {
            Text("Teslimat Kaniti", fontWeight = FontWeight.SemiBold)
        }
    }

    // Status Update Dialog
    if (showStatusDialog) {
        StatusUpdateDialog(
            currentStatus = shipment.status,
            onDismiss = { showStatusDialog = false },
            onStatusSelected = { status ->
                showStatusDialog = false
                onStatusUpdate(status)
            }
        )
    }
}

@Composable
private fun StatusTimeline(currentStatus: ShipmentStatus) {
    val steps = listOf(
        ShipmentStatus.Assigned,
        ShipmentStatus.Loaded,
        ShipmentStatus.InTransit,
        ShipmentStatus.Delivered
    )
    val currentIndex = steps.indexOf(currentStatus).coerceAtLeast(0)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        steps.forEachIndexed { index, step ->
            val isActive = index <= currentIndex
            val dotColor = if (isActive) Orange500 else SlateTextSecondary.copy(alpha = 0.3f)

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .clip(CircleShape)
                        .background(dotColor)
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = step.displayName(),
                    style = MaterialTheme.typography.labelSmall,
                    color = if (isActive) Orange500 else SlateTextSecondary
                )
            }
        }
    }
}

@Composable
private fun DetailItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = SlateTextSecondary
        )
    }
}

@Composable
private fun StatusUpdateDialog(
    currentStatus: ShipmentStatus,
    onDismiss: () -> Unit,
    onStatusSelected: (ShipmentStatus) -> Unit
) {
    val availableStatuses = listOf(
        ShipmentStatus.Loaded,
        ShipmentStatus.InTransit,
        ShipmentStatus.Delivered
    ).filter { it != currentStatus }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Durumu Guncelle") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                availableStatuses.forEach { status ->
                    TextButton(
                        onClick = { onStatusSelected(status) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(status.displayName())
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Iptal")
            }
        }
    )
}
