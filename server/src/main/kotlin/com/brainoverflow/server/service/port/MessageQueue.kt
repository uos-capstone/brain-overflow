package com.brainoverflow.server.service.port

import org.springframework.stereotype.Service

interface MessageQueue {
    fun sendMessage(message: Message)
}