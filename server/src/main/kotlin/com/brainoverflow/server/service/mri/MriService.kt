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
import com.brainoverflow.server.service.UserService
import com.brainoverflow.server.service.port.Message
import com.brainoverflow.server.service.port.MessageQueue
import org.slf4j.LoggerFactory
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.util.*

@Service
@Transactional(readOnly = true)
class MriService(
    private val redisTemplate: StringRedisTemplate,
    private val mriImageRepository: MriImageRepository,
    private val mriResultRepository: MriResultRepository,
    private val messageQueue: MessageQueue,
    private val userService: UserService,
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun registerMRIPrediction(mriId: UUID) {
        val mriImage = mriImageRepository.findByIdOrNull(mriId)
            ?: throw BOException(ReturnCode.NOT_EXIST_IMAGE)
        val mriResult = createMriResult(mriImage)
        messageQueue.sendMessage(
            Message("AlzheimerAiQueue", mriImage.id.toString())
        )
        mriResult.changeStatus(PredictionStatus.PROGRESS)
    }

    private fun createMriResult(mriImage: MriImage): MriResult {
        val newResult =
            MriResult(mriImage = mriImage, predictionStatus = PredictionStatus.NOT_STARTED)
        return mriResultRepository.save(newResult)
    }

    @Transactional
    fun receiveResult(mriResultDto: MriResultDto) {
        val mriImage =
            mriImageRepository.findByIdOrNull(mriResultDto.mriImageId) ?: throw BOException(
                ReturnCode.NOT_EXIST_IMAGE
            )

        val mriResult =
            mriImage.mriResults.find { it.id == mriResultDto.mriResultId } ?: throw BOException(
                ReturnCode.NOT_EXIST_RESULT
            )

        mriResult.changeStatus(predictionStatus = PredictionStatus.COMPLETED)
        mriResult.addComment(mriResultDto.comment)
        logger.info("Mri Created = ${mriResultDto.comment}")
        val userId = mriImage.user.id

        val serverId = redisTemplate.opsForValue().get("ws:user:$userId") ?: return
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

    private val uploadDir = Paths.get("mri-uploads")  // 상대 경로 or 절대 경로

    init {
        // 디렉토리가 없으면 생성
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir)
        }
    }


    @Transactional
    fun registerMRIImage(file: MultipartFile, userId: UUID) {
        // 유저 조회
        val user = userService.getByUserId(userId)
        // 파일명 생성 및 저장
        val extension = file.originalFilename?.substringAfterLast('.', "") ?: "dat"
        val fileName = "${UUID.randomUUID()}_${userId}.$extension"
        val filePath = uploadDir.resolve(fileName)

        Files.copy(file.inputStream, filePath, StandardCopyOption.REPLACE_EXISTING)

        // 엔티티 저장
        val mriImage = MriImage(user, filePath.toString())
        mriImageRepository.save(mriImage)
    }

}