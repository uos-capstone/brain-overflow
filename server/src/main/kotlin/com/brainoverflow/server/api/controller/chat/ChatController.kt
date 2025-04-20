package com.brainoverflow.server.api.controller.chat

import com.brainoverflow.server.api.dto.request.chat.ChatMessage
import org.slf4j.LoggerFactory
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.web.bind.annotation.RestController

@RestController
class ChatController(
    private val messagingTemplate: SimpMessagingTemplate
) {

    private val log = LoggerFactory.getLogger(ChatController::class.java)

    @MessageMapping("/chat.joinRoom")
    fun joinRoom(@Payload chatMessage: ChatMessage) {
        val destination = "/topic/${chatMessage.roomId}"
        log.info("JOIN 메시지 전송 destination: $destination")
        messagingTemplate.convertAndSend(destination, chatMessage)
    }

    @MessageMapping("/chat.sendMessage")
    fun sendMessage(@Payload chatMessage: ChatMessage) {
        val destination = "/topic/${chatMessage.roomId}"
        log.info("CHAT 메시지 전송 destination: $destination")
        messagingTemplate.convertAndSend(destination, chatMessage)
    }

    fun sendToUser(userId: String, resultId: String) {
        val payload = mapOf(
            "userId" to userId,
            "resultId" to resultId,
            "message" to "AI 응답이 완료되었습니다"
        )
        messagingTemplate.convertAndSend("/topic/ai-response.$userId", payload)
    }
}
