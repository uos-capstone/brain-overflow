package com.brainoverflow.server.external.dto.request.mri

import com.brainoverflow.server.domain.mri.MriResult
import com.brainoverflow.server.domain.mri.PredictionStatus
import java.util.UUID

data class MriResultDto(
    val mriPredictionStatus: PredictionStatus,
    val mriImageId: UUID?,
    val mriResultId: Long?,
    val resultFilePath: String?,
    val targetAge: Int
) {
    companion object {
        fun fromDomain(mriResult: MriResult): MriResultDto {
            return MriResultDto(
                mriPredictionStatus = mriResult.predictionStatus,
                mriImageId = mriResult.mriImage.id,
                mriResultId = mriResult.id,
                resultFilePath = mriResult.resultFilePath,
                targetAge = mriResult.targetAge
            )
        }
    }
}
