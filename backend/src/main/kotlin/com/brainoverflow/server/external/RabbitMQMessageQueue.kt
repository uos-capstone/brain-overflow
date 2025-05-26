package com.brainoverflow.server.external

import com.brainoverflow.server.service.port.Message
import com.brainoverflow.server.service.port.MessageQueue
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.stereotype.Service

@Service
class RabbitMQMessageQueue(
    private val rabbitTemplate: RabbitTemplate,
) : MessageQueue {
    override fun sendMessage(message: Message) {
        rabbitTemplate.convertAndSend("AlzheimerAiService", message)
    }

    override fun sendMessage(
        routingKey: String,
        message: Message,
    ) {
        rabbitTemplate.convertAndSend(
            message.channel,
            routingKey,
            message.message,
        )
    }
}
