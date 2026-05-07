package com.klc.logicroute.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShipmentDetailScreen(
    shipment: Shipment?,
    isLoading: Boolean,
    onStatusUpdate: (ShipmentStatus) -> Unit,
    onDeliveredWithPod: (Shipment) -> Unit,
    onNavigateClick: (Shipment) -> Unit,
    onCallClick: (String) -> Unit,
    onPodClick: (Shipment) -> Unit = {},
    modifier: Modifier = Modifier
) {
    if (isLoading || shipment == null) {
        LoadingIndicator(modifier = modifier)
        return
    }

    val sheetState = rememberModalBottomSheetState()
    var showStatusSheet by remember { mutableStateOf(false) }

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
                onClick = { showStatusSheet = true },
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
            Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Teslimat Kaniti", fontWeight = FontWeight.SemiBold)
        }
    }

    // Status Update Bottom Sheet
    if (showStatusSheet) {
        ModalBottomSheet(
            onDismissRequest = { showStatusSheet = false },
            sheetState = sheetState,
            shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
        ) {
            StatusUpdateSheet(
                currentStatus = shipment.status,
                onStatusSelected = { status ->
                    showStatusSheet = false
                    if (status == ShipmentStatus.Delivered) {
                        // Auto-redirect to delivery confirmation
                        onDeliveredWithPod(shipment)
                    } else {
                        onStatusUpdate(status)
                    }
                },
                onDismiss = { showStatusSheet = false }
            )
        }
    }
}

@Composable
private fun StatusUpdateSheet(
    currentStatus: ShipmentStatus,
    onStatusSelected: (ShipmentStatus) -> Unit,
    onDismiss: () -> Unit
) {
    val availableStatuses = listOf(
        ShipmentStatus.Loaded to "Yuk tamamlandi, araca yuklendi",
        ShipmentStatus.InTransit to "Yola cikti, teslimat noktasina gidiyor",
        ShipmentStatus.Delivered to "Teslim edildi (kanit ekrani acilacak)"
    ).filter { it.first != currentStatus }

    Column(
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(
            text = "Durumu Guncelle",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Text(
            text = "Mevcut durum: ${currentStatus.displayName()}",
            style = MaterialTheme.typography.bodyMedium,
            color = SlateTextSecondary,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        availableStatuses.forEach { (status, description) ->
            val colors = when (status) {
                ShipmentStatus.Loaded -> Pair(Color(0xFFDBEAFE), InfoBlue)
                ShipmentStatus.InTransit -> Pair(Color(0xFFFEF3C7), Color(0xFFD97706))
                ShipmentStatus.Delivered -> Pair(Color(0xFFDCFCE7), SuccessGreen)
                else -> Pair(Color.Transparent, SlateTextSecondary)
            }
            val bgColor = colors.first
            val iconColor = colors.second

            Card(
                onClick = { onStatusSelected(status) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = bgColor)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(iconColor.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = null,
                            tint = iconColor,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Column {
                        Text(
                            text = status.displayName(),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = description,
                            style = MaterialTheme.typography.bodySmall,
                            color = SlateTextSecondary
                        )
                    }
                }
            }

            Spacer(Modifier.height(4.dp))
        }

        Spacer(Modifier.height(24.dp))
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
                        .size(if (index == currentIndex) 16.dp else 12.dp)
                        .clip(CircleShape)
                        .background(dotColor)
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = step.displayName(),
                    style = MaterialTheme.typography.labelSmall,
                    color = if (isActive) Orange500 else SlateTextSecondary,
                    fontWeight = if (index == currentIndex) FontWeight.Bold else FontWeight.Normal
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
