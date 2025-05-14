package com.brainoverflow.server.external.controller.chat

import com.brainoverflow.server.domain.chat.ChatMessageDocument
import com.brainoverflow.server.domain.chat.ChatMessageRepository
import com.brainoverflow.server.external.dto.request.chat.ChatMessage
import com.brainoverflow.server.external.dto.response.chat.ChatMessageResponse
import com.brainoverflow.server.external.dto.response.chat.ChatRoomsResponse
import com.brainoverflow.server.service.chat.ChatRoomService
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.messaging.simp.annotation.SendToUser
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.security.Principal
import java.time.Instant
import java.time.LocalDateTime
import java.util.*

@RestController
class ChatController(
    private val messagingTemplate: SimpMessagingTemplate,
    private val charRoomService: ChatRoomService,
    private val chatMessageRepository: ChatMessageRepository,
    private val redis: StringRedisTemplate
) {

    private val log =
        LoggerFactory.getLogger(ChatController::class.java)

    @MessageMapping("/chat.joinRoom")
    fun joinRoom(@Payload chatMessage: ChatMessage) {
        val destination = "/topic/${chatMessage.roomId}"
        log.info("JOIN 메시지 전송 destination: $destination")
        messagingTemplate.convertAndSend(destination, chatMessage)
    }

    @MessageMapping("/chat.sendMessage")
    fun sendMessage(
        @Payload chatMessage: ChatMessage,
        principal: Principal
    ) {
        val destination = "/topic/${chatMessage.roomId}"
        log.info("CHAT 메시지 전송 destination: $destination")
        val save = chatMessageRepository.save(
            ChatMessageDocument(
                id = UUID.randomUUID(),
                roomId = chatMessage.roomId.toLong(),
                senderId = UUID.fromString(principal.name),
                message = chatMessage.content,
                createdAt = Instant.now(),
            )
        )
        val chatMessageResponse = ChatMessageResponse.from(save)
        messagingTemplate.convertAndSend(destination, chatMessageResponse)
    }

    @MessageMapping("/chatrooms")
    @SendToUser("/queue/chatrooms")
    fun getChatRooms(principal: Principal): ChatRoomsResponse {
        val userId = UUID.fromString(principal.name)
        val userChatRooms = charRoomService.getAllUserChatRooms(userId)
        println("userChatRooms = ${userChatRooms.size}")
        return ChatRoomsResponse(userChatRooms)
    }

    @GetMapping("/chatroom")
    fun pushChatRoomsUpdate() {
        // user 파라미터에는 Principal.name 과 매칭되는 문자열(여기선 UUID 문자열)을 넣습니다.
        messagingTemplate.convertAndSendToUser(
            "abcf6df3-73e9-4bbb-986d-354c11dd0049",
            "/queue/chatrooms",
            "Hello NEW Message"
        )
    }

    @GetMapping("/chatroom/{roomId}")
    fun getChatroomMessages(
        @PathVariable roomId: Long,
        @RequestParam page: Int
    ): Page<ChatMessageResponse> {
        val pageable = PageRequest.of(page, 100)
        return charRoomService.getMessagesFromRoom(pageable, roomId)
    }

    @MessageMapping("/chat")
    fun handleChat(
        msg: ChatMessage,
        principal: Principal
    ) {
        // (선택) DB 저장 로직: chatService.save(msg)

        // 2) User-Queue 패턴: all members except sender
        val members = redis.opsForSet().members("room:${msg.roomId}:users") ?: emptySet()
        members.filter { it != principal.name }.forEach { user ->
            // msg 안에 roomId 있으므로 클라이언트는 이걸 보고 UI 분기 가능
            messagingTemplate.convertAndSendToUser(
                user,
                "/queue/chat",
                msg
            )
        }
    }
}
