package com.klc.logicroute.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.klc.logicroute.data.model.Shipment
import com.klc.logicroute.ui.theme.*

data class PodUiState(
    val recipientName: String = "",
    val notes: String = "",
    val hasPhoto: Boolean = false,
    val isUploading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)

@Composable
fun ProofOfDeliveryScreen(
    shipment: Shipment?,
    onTakePhoto: () -> Unit,
    onPickPhoto: () -> Unit,
    hasPhoto: Boolean,
    onRemovePhoto: () -> Unit,
    onSubmit: (recipientName: String, notes: String) -> Unit,
    isUploading: Boolean,
    isSuccess: Boolean,
    error: String?,
    onDismissSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    var recipientName by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var showPhotoOptions by remember { mutableStateOf(false) }

    if (isSuccess) {
        AlertDialog(
            onDismissRequest = onDismissSuccess,
            title = { Text("Basarili") },
            text = { Text("Teslimat kaniti basariyla yuklendi.") },
            confirmButton = {
                TextButton(onClick = onDismissSuccess) {
                    Text("Tamam")
                }
            }
        )
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Shipment info header
        if (shipment != null) {
            Card(
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Sevkiyat: ${shipment.shipmentNumber}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${shipment.originCity} → ${shipment.destinationCity}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = SlateTextSecondary
                    )
                }
            }
        }

        // Photo section
        Card(
            shape = RoundedCornerShape(12.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Teslimat Fotografi",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                if (hasPhoto) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.Check,
                                contentDescription = null,
                                tint = SuccessGreen,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                "Fotograf eklendi",
                                color = SuccessGreen,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                        IconButton(onClick = onRemovePhoto) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Kaldir",
                                tint = ErrorRed
                            )
                        }
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .border(
                                width = 2.dp,
                                color = SlateTextSecondary.copy(alpha = 0.3f),
                                shape = RoundedCornerShape(8.dp)
                            )
                            .clickable { showPhotoOptions = true },
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.Add,
                                contentDescription = null,
                                tint = SlateTextSecondary,
                                modifier = Modifier.size(32.dp)
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                "Fotograf Ekle",
                                color = SlateTextSecondary,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
            }
        }

        // Recipient info
        Card(
            shape = RoundedCornerShape(12.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Teslim Alan Bilgileri",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                OutlinedTextField(
                    value = recipientName,
                    onValueChange = { recipientName = it },
                    label = { Text("Teslim Alan Ad Soyad") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notlar (opsiyonel)") },
                    minLines = 3,
                    maxLines = 5,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
            }
        }

        if (error != null) {
            Text(
                text = error,
                color = ErrorRed,
                style = MaterialTheme.typography.bodySmall
            )
        }

        // Submit button
        Button(
            onClick = { onSubmit(recipientName, notes) },
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(12.dp),
            enabled = !isUploading && recipientName.isNotBlank()
        ) {
            if (isUploading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
            } else {
                Text(
                    text = "Teslimat Kanitini Gonder",
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }

    // Photo options dialog
    if (showPhotoOptions) {
        AlertDialog(
            onDismissRequest = { showPhotoOptions = false },
            title = { Text("Fotograf Ekle") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    TextButton(
                        onClick = {
                            showPhotoOptions = false
                            onTakePhoto()
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Kamera ile Cek")
                    }
                    TextButton(
                        onClick = {
                            showPhotoOptions = false
                            onPickPhoto()
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Galeriden Sec")
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showPhotoOptions = false }) {
                    Text("Iptal")
                }
            }
        )
    }
}
