package com.brainoverflow.server.external.controller.chat

import com.brainoverflow.server.external.dto.request.chat.ChatMessage
import com.brainoverflow.server.service.chat.ChatService
import org.slf4j.LoggerFactory
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.web.bind.annotation.RestController
import java.security.Principal
import java.util.*

@RestController
class ChatController(
    private val chatService: ChatService,
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
        principal: Principal,
    ) {
        // (선택) DB 저장 로직: chatService.save(msg)
        log.info("CHAT 메시지 전송 destination: ${msg.roomId}")
        chatService.saveChat(userId = UUID.fromString(principal.name), msg = msg)
    }
}
