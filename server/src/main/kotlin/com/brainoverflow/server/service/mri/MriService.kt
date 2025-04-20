package com.brainoverflow.server.service.mri

import com.brainoverflow.server.api.dto.request.mri.MriResultDto
import com.brainoverflow.server.common.enums.PredictionStatus
import com.brainoverflow.server.common.enums.ReturnCode
import com.brainoverflow.server.common.exception.BOException
import com.brainoverflow.server.domain.mri.MriImage
import com.brainoverflow.server.domain.mri.MriImageRepository
import com.brainoverflow.server.domain.mri.MriResult
import com.brainoverflow.server.domain.mri.MriResultRepository
import com.brainoverflow.server.domain.user.UserRepository
import com.brainoverflow.server.service.port.Message
import com.brainoverflow.server.service.port.MessageQueue
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.context.annotation.Lazy
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.util.Assert
import java.util.*

@Service
@Transactional(readOnly = true)
class MriService (
    private val redisTemplate: StringRedisTemplate,
    private val mriImageRepository: MriImageRepository,
    private val mriResultRepository: MriResultRepository,
    private val userRepository: UserRepository,
    private val messageQueue: MessageQueue
){
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun registerMRIImage(){
        val optional = userRepository.findById(UUID.fromString("abcf6df3-73e9-4bbb-986d-354c11dd0049"))
        mriImageRepository.save(MriImage(optional.get()))
    }

    @Transactional
    fun registerMRIPrediction(mriId: UUID){
        val mriImage = mriImageRepository.findByIdOrNull(mriId) ?: throw BOException(ReturnCode.NOT_EXIST_IMAGE)
        val mriResult = createMriResult(mriImage)
        messageQueue.sendMessage(
            Message("AlzheimerAiQueue", mriImage.id.toString())
        )
        mriResult.changeStatus(PredictionStatus.PROGRESS)
    }

    private fun createMriResult(mriImage: MriImage): MriResult {
        val newResult = MriResult(mriImage = mriImage, predictionStatus = PredictionStatus.NOT_STARTED)
        return mriResultRepository.save(newResult)
    }

    @Transactional
    fun receiveResult(mriResultDto: MriResultDto) {
        val mriImage =
            mriImageRepository.findByIdOrNull(mriResultDto.mriImageId) ?: throw BOException(ReturnCode.NOT_EXIST_IMAGE)

        val mriResult = mriImage.mriResults.find { it.id == mriResultDto.mriResultId } ?: throw BOException(ReturnCode.NOT_EXIST_RESULT)

        mriResult.changeStatus(predictionStatus = PredictionStatus.COMPLETED)
        mriResult.addComment(mriResultDto.comment)
        logger.info("Mri Created = ${mriResultDto.comment}")

        val userId = mriImage.user.id

        val serverId = redisTemplate.opsForValue().get("ws:user:$userId") ?: return
//        val routingKey = serverId
        val routingKey = "ai.response.queue.$serverId"
        val payload = mapOf(
            "userId" to userId,
            "resultId" to mriResult.id,
            "message" to "AI 응답이 완료되었습니다"
        )

        messageQueue.sendMessage(
            routingKey,
            Message("ai.response.exchange", payload)
        )
    }




}