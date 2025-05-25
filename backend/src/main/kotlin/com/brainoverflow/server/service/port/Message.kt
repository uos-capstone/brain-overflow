package com.brainoverflow.server.service.port

data class Message(
    val channel: String,
    val message: Any,
)
