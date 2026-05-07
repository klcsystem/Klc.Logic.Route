package com.klc.logicroute.util

actual class ImagePicker {
    // In production, this would use UIImagePickerController
    // through a Kotlin/Native wrapper.

    actual suspend fun pickImage(): ByteArray? {
        // Placeholder: requires UIImagePickerController integration
        return null
    }

    actual suspend fun takePhoto(): ByteArray? {
        // Placeholder: requires UIImagePickerController with .camera source
        return null
    }
}
