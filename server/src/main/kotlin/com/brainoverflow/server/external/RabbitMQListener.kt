package com.brainoverflow.server.external

import com.brainoverflow.server.external.dto.request.mri.MriResultDto
import com.brainoverflow.server.service.mri.MriService
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service

@Component
class RabbitMQListener(
    private val mriService: MriService
) {
    @RabbitListener(queues = ["aiCompleteQueue"])
    fun receiveResult(mriResultDto: com.brainoverflow.server.external.dto.request.mri.MriResultDto) {
        mriService.receiveResult(mriResultDto)
    }

}