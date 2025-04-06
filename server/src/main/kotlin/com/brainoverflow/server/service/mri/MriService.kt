package com.brainoverflow.server.service.mri

import com.brainoverflow.server.common.enums.PredictionStatus
import com.brainoverflow.server.common.enums.ReturnCode
import com.brainoverflow.server.common.exception.BOException
import com.brainoverflow.server.common.external.AlzheimerAiService
import com.brainoverflow.server.domain.mri.MriImage
import com.brainoverflow.server.domain.mri.MriImageRepository
import com.brainoverflow.server.domain.mri.MriResult
import com.brainoverflow.server.domain.mri.MriResultRepository
import com.brainoverflow.server.domain.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.util.Assert
import java.util.*

@Service
@Transactional(readOnly = true)
class MriService (
    private val mriImageRepository: MriImageRepository,
    private val mriResultRepository: MriResultRepository,
    private val alzheimerAiService: AlzheimerAiService,
    private val userRepository: UserRepository
){
    private val logger = LoggerFactory.getLogger(javaClass)

    @Transactional
    fun registerMRIImage(){
        val optional = userRepository.findById(UUID.fromString("126b3c71-d8a2-41e9-8358-a106d88ac48b"))
        mriImageRepository.save(MriImage(optional.get()))
    }

    @Transactional
    fun registerMRIPrediction(mriId: UUID){
        val mriImage = mriImageRepository.findByIdOrNull(mriId) ?: throw BOException(ReturnCode.NOT_EXIST_IMAGE)
        val mriResult = createMriResult(mriImage)
        alzheimerAiService.startPrediction(mriImage)
        mriResult.changeStatus(PredictionStatus.PROGRESS)
    }

    private fun createMriResult(mriImage: MriImage): MriResult {
        val newResult = MriResult(mriImage = mriImage, predictionStatus = PredictionStatus.NOT_STARTED)
        return mriResultRepository.save(newResult)

    }

    @RabbitListener(queues = ["aiCompleteQueue"])
    @Transactional
    fun receiveResult(aiResult: AiResult) {
        val mriResult =
            mriResultRepository.findByIdOrNull(aiResult.id) ?: throw BOException(ReturnCode.NOT_EXIST_RESULT)
        mriResult.changeStatus(predictionStatus = PredictionStatus.COMPLETED)
        mriResult.addComment(aiResult.status)
        logger.info(aiResult.status)
    }




}