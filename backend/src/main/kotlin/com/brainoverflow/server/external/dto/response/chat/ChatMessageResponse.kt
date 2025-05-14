package com.brainoverflow.server.external.dto.response.chat

import com.brainoverflow.server.domain.chat.ChatMessageDocument
import java.time.Instant
import java.util.UUID

data class ChatMessageResponse(
    val roomId: Long,
    val senderId: UUID,
    val content: String?,
    val timestamp: Instant
) {
    companion object {
        fun from(chatMessageDocument: ChatMessageDocument): ChatMessageResponse {
            return ChatMessageResponse(
                roomId = chatMessageDocument.roomId,
                senderId = chatMessageDocument.senderId,
                content = chatMessageDocument.message,
                timestamp = chatMessageDocument.createdAt
            )
        }
    }
}