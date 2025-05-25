package com.brainoverflow.server.external.dto.request.chat

import com.brainoverflow.server.external.dto.request.socket.MessageType

data class ChatMessage(
    val type: MessageType, // CHAT AI
    val roomId: String, // 채팅 식별자
    val content: String? = null,
)
