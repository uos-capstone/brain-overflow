package com.brainoverflow.server.common.external

import com.brainoverflow.server.domain.mri.MriImage
import com.brainoverflow.server.service.mri.AiResult
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service

@Service
class AlzheimerAiService(
    private val rabbitTemplate: RabbitTemplate,
){

    @Async
    fun startPrediction(mriImage: MriImage){
        rabbitTemplate.convertAndSend("AlzheimerAiQueue", "", "hello")
        Thread.sleep(10000)  // AI라 가정
        rabbitTemplate.convertAndSend("AlzheimerAiService", "", AiResult(id = 1L, status = "good", score = 90.0))
    }


}