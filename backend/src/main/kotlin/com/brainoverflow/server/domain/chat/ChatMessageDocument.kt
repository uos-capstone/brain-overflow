package com.brainoverflow.server.domain.chat

import com.brainoverflow.server.external.dto.request.socket.MessageType
import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

@Document("chat_messages")
class ChatMessageDocument(
    id: UUID,
    roomId: Long,
    senderId: UUID,
    senderName: String,
    message: String?,
    createdAt: LocalDateTime,
    messageType: MessageType,
) {
    @Id
    var id: UUID? = id
    val roomId: Long = roomId
    val senderId: UUID = senderId
    val senderName: String = senderName
    val message: String? = message
    val messageType: MessageType = messageType
    val createdAt: LocalDateTime = createdAt
}