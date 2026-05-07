package com.klc.logicroute.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klc.logicroute.data.model.Shipment
import com.klc.logicroute.ui.theme.SlateTextSecondary
import com.klc.logicroute.util.DateFormatter

@Composable
fun ShipmentCard(
    shipment: Shipment,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
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
                Text(
                    text = shipment.shipmentNumber,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                StatusBadge(status = shipment.status)
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = shipment.originCity.ifBlank { shipment.originAddress },
                        style = MaterialTheme.typography.bodyMedium,
                        color = SlateTextSecondary
                    )
                    Text(
                        text = "\u2193",
                        style = MaterialTheme.typography.bodySmall,
                        color = SlateTextSecondary
                    )
                    Text(
                        text = shipment.destinationCity.ifBlank { shipment.destinationAddress },
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (shipment.weight > 0) {
                    Text(
                        text = "${shipment.weight} kg",
                        style = MaterialTheme.typography.bodySmall,
                        color = SlateTextSecondary
                    )
                }
                if (shipment.scheduledDate.isNotBlank()) {
                    Text(
                        text = DateFormatter.formatDate(shipment.scheduledDate),
                        style = MaterialTheme.typography.bodySmall,
                        color = SlateTextSecondary
                    )
                }
            }
        }
    }
}
