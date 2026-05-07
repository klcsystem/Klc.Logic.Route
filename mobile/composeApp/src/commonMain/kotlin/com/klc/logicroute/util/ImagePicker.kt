package com.klc.logicroute.util

expect class ImagePicker() {
    suspend fun pickImage(): ByteArray?
    suspend fun takePhoto(): ByteArray?
}
