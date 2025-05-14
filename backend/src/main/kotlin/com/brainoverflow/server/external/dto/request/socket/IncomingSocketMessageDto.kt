package com.brainoverflow.server.external.dto.request.socket

data class IncomingSocketMessageDto(
    val type: MessageType,      // "CHAT" 또는 "AI"
    val content: String,        // 텍스트 또는 이미지 URL
    val roomId: Long,
    val nickname: String,
    val timestamp: String,      // e.g. "2020-04-05-01-01-10"
    val messageId: String       // 고유 MID
)
