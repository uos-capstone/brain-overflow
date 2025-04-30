package com.brainoverflow.server.domain.chat

import com.brainoverflow.server.common.enums.MessageType
import jakarta.persistence.Id
import org.springframework.data.mongodb.core.mapping.Document
import java.time.Instant
import java.util.*

@Document("chat_messages")
class ChatMessageDocument(
    roomId: Long,
    senderId: UUID,
    message: String?,
) {
    @Id
    val id: UUID = UUID.randomUUID()
    val roomId: Long = roomId
    val senderId: UUID = senderId
    val message: String
    val type: MessageType = MessageType.TEXT
    val createdAt: Instant = Instant.now()


    init {
        require(!message.isNullOrBlank()) { "message must not be null or blank" }
        this.message = message
    }
}