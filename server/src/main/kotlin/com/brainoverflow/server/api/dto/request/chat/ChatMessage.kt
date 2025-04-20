package com.brainoverflow.server.api.dto.request.chat

import com.brainoverflow.server.common.enums.MessageType
import java.io.Serializable

data class ChatMessage(
    val type: MessageType,  // JOIN, CHAT, LEAVE 구분
    val roomId: String,     // 채팅룸 식별자
    val sender: String,     // 사용자명
    val content: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)
