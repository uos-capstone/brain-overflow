package com.brainoverflow.server.external

import com.brainoverflow.server.common.enums.PredictionStatus
import com.brainoverflow.server.common.enums.ReturnCode
import com.brainoverflow.server.common.exception.BOException
import com.brainoverflow.server.service.mri.MriService
import com.brainoverflow.server.service.port.Message
import com.brainoverflow.server.service.port.MessageQueue
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RabbitMQMessageQueue(
    private val rabbitTemplate: RabbitTemplate,
) : MessageQueue {
    override fun sendMessage(message: Message) {
        rabbitTemplate.convertAndSend("AlzheimerAiService", message)
    }

    override fun sendMessage(routingKey: String, message: Message) {
        rabbitTemplate.convertAndSend(
            message.channel,
            routingKey,
            message.message
        )
    }
}