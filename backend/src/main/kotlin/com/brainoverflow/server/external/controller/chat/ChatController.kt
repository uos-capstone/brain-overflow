package com.brainoverflow.server.external.controller.chat

import com.brainoverflow.server.domain.chat.ChatMessageDocument
import com.brainoverflow.server.domain.chat.ChatMessageRepository
import com.brainoverflow.server.external.dto.request.chat.ChatMessage
import com.brainoverflow.server.external.dto.response.chat.SocketMessageResponse
import com.brainoverflow.server.external.dto.response.chat.ChatRoomsResponse
import com.brainoverflow.server.service.chat.ChatRoomService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.messaging.simp.annotation.SendToUser
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.security.Principal
import java.time.LocalDateTime
import java.util.*

@RestController
class ChatController(
    private val messagingTemplate: SimpMessagingTemplate,
    private val chatMessageRepository: ChatMessageRepository,
    private val redis: StringRedisTemplate
) {

    private val log =
        LoggerFactory.getLogger(ChatController::class.java)

//    @MessageMapping("/chatrooms")
//    @SendToUser("/queue/chatrooms")
//    fun getChatRooms(principal: Principal): ChatRoomsResponse {
//        val userId = UUID.fromString(principal.name)
//        val userChatRooms = charRoomService.getAllUserChatRooms(userId)
//        println("userChatRooms = ${userChatRooms.size}")
//        return ChatRoomsResponse(userChatRooms)
//    }

    @MessageMapping("/chat")
    fun handleChat(
        msg: ChatMessage,
        principal: Principal
    ) {
        // (선택) DB 저장 로직: chatService.save(msg)
        log.info("CHAT 메시지 전송 destination: ${msg.roomId}")
        val save = chatMessageRepository.save(
            ChatMessageDocument(
                id = UUID.randomUUID(),
                roomId = msg.roomId.toLong(),
                senderId = UUID.fromString(principal.name),
                message = msg.content,
                createdAt = LocalDateTime.now(),
                messageType = msg.type
            )
        )
        val socketMessageResponse = SocketMessageResponse.fromChat(save)

        val members = redis.opsForSet().members("room:${msg.roomId}:users") ?: emptySet()
        members.forEach { user ->
            // msg 안에 roomId 있으므로 클라이언트는 이걸 보고 UI 분기 가능
            messagingTemplate.convertAndSendToUser(
                user,
                "/queue/chat",
                socketMessageResponse
            )
        }
    }
}
