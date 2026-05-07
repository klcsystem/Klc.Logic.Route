package com.klc.logicroute.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.klc.logicroute.ui.theme.SlateTextSecondary

data class SignatureLine(
    val points: List<Offset>
)

@Composable
fun SignaturePad(
    lines: List<SignatureLine>,
    onLinesChange: (List<SignatureLine>) -> Unit,
    onClear: () -> Unit,
    modifier: Modifier = Modifier
) {
    var currentLine by remember { mutableStateOf<List<Offset>>(emptyList()) }
    val hasSignature = lines.isNotEmpty() || currentLine.isNotEmpty()

    Column(modifier = modifier) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Imza",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            if (hasSignature) {
                TextButton(onClick = {
                    currentLine = emptyList()
                    onClear()
                }) {
                    Text("Temizle")
                }
            }
        }

        Spacer(Modifier.height(4.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .clip(RoundedCornerShape(8.dp))
                .border(
                    width = 2.dp,
                    color = if (hasSignature) MaterialTheme.colorScheme.primary
                    else SlateTextSecondary.copy(alpha = 0.3f),
                    shape = RoundedCornerShape(8.dp)
                )
                .background(Color.White)
        ) {
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectDragGestures(
                            onDragStart = { offset ->
                                currentLine = listOf(offset)
                            },
                            onDrag = { change, _ ->
                                change.consume()
                                currentLine = currentLine + change.position
                            },
                            onDragEnd = {
                                if (currentLine.isNotEmpty()) {
                                    onLinesChange(lines + SignatureLine(currentLine))
                                    currentLine = emptyList()
                                }
                            },
                            onDragCancel = {
                                currentLine = emptyList()
                            }
                        )
                    }
            ) {
                val stroke = Stroke(
                    width = 3f,
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round
                )

                // Draw completed lines
                lines.forEach { line ->
                    if (line.points.size >= 2) {
                        val path = Path().apply {
                            moveTo(line.points.first().x, line.points.first().y)
                            for (i in 1 until line.points.size) {
                                lineTo(line.points[i].x, line.points[i].y)
                            }
                        }
                        drawPath(path, Color.Black, style = stroke)
                    }
                }

                // Draw current line
                if (currentLine.size >= 2) {
                    val path = Path().apply {
                        moveTo(currentLine.first().x, currentLine.first().y)
                        for (i in 1 until currentLine.size) {
                            lineTo(currentLine[i].x, currentLine[i].y)
                        }
                    }
                    drawPath(path, Color.Black, style = stroke)
                }
            }

            if (!hasSignature) {
                Text(
                    text = "Imzanizi buraya atiniz",
                    color = SlateTextSecondary.copy(alpha = 0.5f),
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.align(Alignment.Center)
                )
            }
        }
    }
}
