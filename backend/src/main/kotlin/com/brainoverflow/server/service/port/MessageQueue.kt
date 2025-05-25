package com.brainoverflow.server.service.port

interface MessageQueue {
    fun sendMessage(message: Message)

    fun sendMessage(
        routingKey: String,
        message: Message,
    )
}
