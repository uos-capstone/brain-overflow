package com.brainoverflow.server.service.chat

import com.brainoverflow.server.domain.chat.ChatMessageDocument
import com.brainoverflow.server.domain.chat.ChatMessageRepository
import com.brainoverflow.server.external.dto.request.chat.ChatMessage
import com.brainoverflow.server.external.dto.response.chat.SocketMessageResponse
import com.brainoverflow.server.service.UserService
import org.slf4j.LoggerFactory
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.*

@Service
class ChatService(
    private val userService: UserService,
    private val chatMessageRepository: ChatMessageRepository,
    private val redis: StringRedisTemplate,
    private val messagingTemplate: SimpMessagingTemplate,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    fun saveChat(
        userId: UUID,
        msg: ChatMessage,
    ) {
        val sender = userService.getByUserId(userId)
        val save =
            chatMessageRepository.save(
                ChatMessageDocument(
                    id = UUID.randomUUID(),
                    roomId = msg.roomId.toLong(),
                    senderId = sender.id,
                    senderName = sender.nickname,
                    message = msg.content,
                    createdAt = LocalDateTime.now(),
                    messageType = msg.type,
                ),
            )
        val socketMessageResponse = SocketMessageResponse.fromChat(save)
        broadcastChat(socketMessageResponse)
    }

    private fun broadcastChat(socketMessageResponse: SocketMessageResponse) {
        val members =
            redis.opsForSet().members("room:${socketMessageResponse.roomId}:users") ?: emptySet()
        log.info("Room Member Size : ${members.size}")
        members.forEach { user ->
            // msg 안에 roomId 있으므로 클라이언트는 이걸 보고 UI 분기 가능
            messagingTemplate.convertAndSendToUser(
                user,
                "/queue/chat",
                socketMessageResponse,
            )
        }
    }
}
