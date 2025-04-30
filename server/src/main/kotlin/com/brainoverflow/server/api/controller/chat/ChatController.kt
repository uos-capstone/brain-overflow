package com.brainoverflow.server.api.controller.chat

import com.brainoverflow.server.api.dto.request.chat.ChatMessage
import com.brainoverflow.server.api.dto.response.chat.ChatRoomsResponse
import com.brainoverflow.server.domain.chat.ChatMessageDocument
import com.brainoverflow.server.domain.chat.ChatMessageRepository
import com.brainoverflow.server.service.chat.ChatRoomService
import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.messaging.simp.annotation.SendToUser
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.security.Principal
import java.util.*

@RestController
class ChatController(
    private val messagingTemplate: SimpMessagingTemplate,
    private val charRoomService: ChatRoomService,
    private val chatMessageRepository: ChatMessageRepository
) {

    private val log = LoggerFactory.getLogger(ChatController::class.java)

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
        chatMessageRepository.save(
            ChatMessageDocument(
                roomId = chatMessage.roomId.toLong(),
                senderId = UUID.fromString(principal.name),
                message = chatMessage.content
            )
        )
        messagingTemplate.convertAndSend(destination, chatMessage)
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
}
