package com.brainoverflow.server.external.dto.request.chat

import com.brainoverflow.server.domain.chat.MessageType

data class ChatMessage(
    val type: MessageType,  // JOIN, CHAT, LEAVE 구분
    val roomId: String,     // 채팅룸 식별자
    val content: String? = null,
)
