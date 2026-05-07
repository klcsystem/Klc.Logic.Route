package com.klc.logicroute.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.klc.logicroute.data.model.Shipment
import com.klc.logicroute.data.model.ShipmentStatus
import com.klc.logicroute.ui.components.LoadingIndicator
import com.klc.logicroute.ui.components.ShipmentCard

enum class ShipmentFilter(val label: String) {
    All("Tumu"),
    Assigned("Atandi"),
    InTransit("Yolda"),
    Delivered("Teslim Edildi")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShipmentListScreen(
    shipments: List<Shipment>,
    isLoading: Boolean,
    onRefresh: () -> Unit,
    onShipmentClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedFilter by remember { mutableStateOf(ShipmentFilter.All) }

    val filteredShipments = remember(shipments, selectedFilter) {
        when (selectedFilter) {
            ShipmentFilter.All -> shipments
            ShipmentFilter.Assigned -> shipments.filter { it.status == ShipmentStatus.Assigned }
            ShipmentFilter.InTransit -> shipments.filter { it.status == ShipmentStatus.InTransit || it.status == ShipmentStatus.Loaded }
            ShipmentFilter.Delivered -> shipments.filter { it.status == ShipmentStatus.Delivered }
        }
    }

    Column(modifier = modifier.fillMaxSize()) {
        // Filter chips
        SingleChoiceSegmentedButtonRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            ShipmentFilter.entries.forEachIndexed { index, filter ->
                SegmentedButton(
                    selected = selectedFilter == filter,
                    onClick = { selectedFilter = filter },
                    shape = SegmentedButtonDefaults.itemShape(
                        index = index,
                        count = ShipmentFilter.entries.size
                    )
                ) {
                    Text(
                        text = filter.label,
                        style = MaterialTheme.typography.labelMedium
                    )
                }
            }
        }

        PullToRefreshBox(
            isRefreshing = isLoading,
            onRefresh = onRefresh,
            modifier = Modifier.fillMaxSize()
        ) {
            if (!isLoading && filteredShipments.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Sevkiyat bulunamadi",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else if (isLoading && shipments.isEmpty()) {
                LoadingIndicator()
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(
                        items = filteredShipments,
                        key = { it.id }
                    ) { shipment ->
                        ShipmentCard(
                            shipment = shipment,
                            onClick = { onShipmentClick(shipment.id) }
                        )
                    }
                }
            }
        }
    }
}
