package com.brainoverflow.server.service.chat

import com.brainoverflow.server.domain.chat.ChatMessageDocument
import com.brainoverflow.server.domain.chat.ChatMessageRepository
import com.brainoverflow.server.external.DynamicRabbitListenerRegistrar.Companion.CHAT_EXCHANGE
import com.brainoverflow.server.external.dto.request.chat.ChatMessage
import com.brainoverflow.server.external.dto.response.chat.SocketMessageResponse
import com.brainoverflow.server.service.UserService
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.core.RabbitTemplate
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
    private val rabbitTemplate: RabbitTemplate,
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

    fun broadcastChat(socketMessageResponse: SocketMessageResponse) {
        // 1) 방에 속한 모든 유저 ID 조회
        val members = redis.opsForSet()
            .members("room:${socketMessageResponse.roomId}:users")
            ?.filterNotNull()
            ?: return

        // 2) 유저별로 접속 서버 읽어서 그룹핑
        val byServer: Map<String, List<String>> = members
            .mapNotNull { userId ->
                // ws:user:{userId} 키에 저장된 serverId 읽기
                val serverId = redis.opsForValue().get("ws:user:$userId")
                serverId?.let { userId to it }
            }
            .groupBy({ it.second }, { it.first })

        // 3) 서버별로 라우팅
        byServer.forEach { (serverId, userList) ->
            val payload = mapOf(
                "userIds" to userList,
                "chat" to socketMessageResponse
            )
            // routingKey = serverId 로만 퍼블리시
            rabbitTemplate.convertAndSend(CHAT_EXCHANGE, serverId, payload)
        }
    }
}
