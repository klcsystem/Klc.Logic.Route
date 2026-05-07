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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.klc.logicroute.data.model.Shipment
import com.klc.logicroute.ui.components.SignatureLine
import com.klc.logicroute.ui.components.SignaturePad
import com.klc.logicroute.ui.theme.*

@Composable
fun DeliveryConfirmScreen(
    shipment: Shipment?,
    onTakePhoto: () -> Unit,
    onPickPhoto: () -> Unit,
    hasPhoto: Boolean,
    onRemovePhoto: () -> Unit,
    signatureLines: List<SignatureLine>,
    onSignatureLinesChange: (List<SignatureLine>) -> Unit,
    onClearSignature: () -> Unit,
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
            text = { Text("Teslimat onaylandi ve kanit basariyla yuklendi.") },
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
        // Shipment summary header
        if (shipment != null) {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = Orange50
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = shipment.shipmentNumber,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "${shipment.originCity} \u2192 ${shipment.destinationCity}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = SlateTextSecondary
                    )
                    if (shipment.customerName.isNotBlank()) {
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = "Musteri: ${shipment.customerName}",
                            style = MaterialTheme.typography.bodySmall,
                            color = SlateTextSecondary
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        if (shipment.weight > 0) {
                            Text(
                                "${shipment.weight} kg",
                                style = MaterialTheme.typography.labelMedium,
                                color = SlateTextSecondary
                            )
                        }
                        if (shipment.palletCount > 0) {
                            Text(
                                "${shipment.palletCount} palet",
                                style = MaterialTheme.typography.labelMedium,
                                color = SlateTextSecondary
                            )
                        }
                    }
                }
            }
        }

        // Recipient name
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
                            .height(100.dp)
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
                                "Fotograf Cek veya Sec",
                                color = SlateTextSecondary,
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }
            }
        }

        // Signature Pad
        Card(
            shape = RoundedCornerShape(12.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                SignaturePad(
                    lines = signatureLines,
                    onLinesChange = onSignatureLinesChange,
                    onClear = onClearSignature
                )
            }
        }

        // Notes
        Card(
            shape = RoundedCornerShape(12.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Notlar",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Teslimat notlari (opsiyonel)") },
                    minLines = 2,
                    maxLines = 4,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
            }
        }

        if (error != null) {
            Card(
                shape = RoundedCornerShape(8.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFEE2E2))
            ) {
                Text(
                    text = error,
                    color = ErrorRed,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(12.dp)
                )
            }
        }

        // Submit button
        Button(
            onClick = { onSubmit(recipientName, notes) },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
            enabled = !isUploading && recipientName.isNotBlank()
        ) {
            if (isUploading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
            } else {
                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Text(
                    text = "Teslimati Onayla",
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(Modifier.height(16.dp))
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
