package com.klc.logicroute.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klc.logicroute.data.model.ShipmentStatus
import com.klc.logicroute.ui.theme.*

@Composable
fun StatusBadge(status: ShipmentStatus, modifier: Modifier = Modifier) {
    val (bgColor, textColor) = when (status) {
        ShipmentStatus.Assigned -> Orange100 to Orange700
        ShipmentStatus.Loaded -> Color(0xFFDBEAFE) to InfoBlue
        ShipmentStatus.InTransit -> Color(0xFFFEF3C7) to Color(0xFFD97706)
        ShipmentStatus.Delivered -> Color(0xFFDCFCE7) to SuccessGreen
        ShipmentStatus.Cancelled -> Color(0xFFFEE2E2) to ErrorRed
    }

    Text(
        text = status.displayName(),
        color = textColor,
        fontSize = 12.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(bgColor)
            .padding(horizontal = 8.dp, vertical = 4.dp)
    )
}
