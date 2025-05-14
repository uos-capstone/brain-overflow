package com.brainoverflow.server.domain.chat

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant
import java.util.*

@Document("chat_messages")
class ChatMessageDocument(
    id: UUID,
    roomId: Long,
    senderId: UUID,
    message: String?,
    createdAt: Instant,
) {
    @Id
    var id: UUID? = id
    val roomId: Long = roomId
    val senderId: UUID = senderId
    val message: String? = message
    val type: MessageType = MessageType.TEXT
    val createdAt: Instant = createdAt
}