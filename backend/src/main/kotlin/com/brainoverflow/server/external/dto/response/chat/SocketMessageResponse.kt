package com.brainoverflow.server.external.dto.response.chat

import com.brainoverflow.server.domain.chat.ChatMessageDocument
import com.brainoverflow.server.external.dto.request.socket.MessageType
import java.time.LocalDateTime
import java.util.UUID

data class SocketMessageResponse(
    val type: MessageType,
    val roomId: Long?,
    val senderId: UUID?,
    val senderName: String?,
    val content: String?,
    val timestamp: LocalDateTime,
) {
    companion object {
        fun fromChat(chatMessageDocument: ChatMessageDocument): SocketMessageResponse {
            return SocketMessageResponse(
                roomId = chatMessageDocument.roomId,
                senderId = chatMessageDocument.senderId,
                senderName = chatMessageDocument.senderName,
                content = chatMessageDocument.message,
                timestamp = chatMessageDocument.createdAt,
                type = chatMessageDocument.messageType,
            )
        }

        fun fromAiResponse(resultId: String): SocketMessageResponse {
            return SocketMessageResponse(
                type = MessageType.AI,
                roomId = null,
                senderId = null,
                senderName = null,
                content = resultId,
                timestamp = LocalDateTime.now(),
            )
        }
    }
}
