package com.brainoverflow.server.external.ws

import org.springframework.amqp.rabbit.core.RabbitAdmin
import org.springframework.context.event.EventListener
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.stereotype.Component
import org.springframework.web.socket.messaging.SessionDisconnectEvent

@Component
class WebSocketDisconnectListener(
    private val rabbitAdmin: RabbitAdmin, // Spring의 RabbitMQ 제어용 클래스
) {
    @EventListener
    fun handleSessionDisconnect(event: SessionDisconnectEvent) {
        val headerAccessor = StompHeaderAccessor.wrap(event.message)
        val sessionId = headerAccessor.sessionId
        println("🔌 세션 종료 감지: $sessionId")

        // 연결 끊긴 유저의 큐 삭제 시도
        deleteUserQueue(sessionId)
    }

    fun deleteUserQueue(sessionId: String?) {
        return
        if (sessionId.isNullOrBlank()) {
            println("SessionId 없음. 큐 삭제 스킵.")
            return
        }

        val queueName = "chat-user$sessionId"
        try {
            rabbitAdmin.deleteQueue(queueName)
            println("🧹 RabbitMQ 큐 삭제 완료: $queueName")
        } catch (e: Exception) {
            println("큐 삭제 실패: ${e.message}")
        }
    }
}
