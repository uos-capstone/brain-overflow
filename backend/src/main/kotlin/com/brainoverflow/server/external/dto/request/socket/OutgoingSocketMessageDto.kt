package com.brainoverflow.server.external.dto.request.socket

data class OutgoingSocketMessageDto(
    val type: MessageType = MessageType.CHAT,
    val content: String, // 텍스트, 이미지 URL, MRI 리스트 URL 등
    val roomId: Long,
)
