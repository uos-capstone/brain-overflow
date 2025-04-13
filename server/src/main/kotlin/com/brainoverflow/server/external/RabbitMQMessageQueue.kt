package com.brainoverflow.server.external

import com.brainoverflow.server.common.enums.PredictionStatus
import com.brainoverflow.server.common.enums.ReturnCode
import com.brainoverflow.server.common.exception.BOException
import com.brainoverflow.server.service.mri.AiResult
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
    private val mriService: MriService,
) : MessageQueue {
    override fun sendMessage(message: Message) {
        rabbitTemplate.convertAndSend("AlzheimerAiService", message)
    }

    @RabbitListener(queues = ["aiCompleteQueue"])
    fun receiveResult(aiResult: AiResult) {
        mriService.receiveResult(aiResult)
    }
}