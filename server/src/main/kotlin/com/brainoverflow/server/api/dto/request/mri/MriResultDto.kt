package com.brainoverflow.server.api.dto.request.mri

import com.brainoverflow.server.common.enums.PredictionStatus
import java.util.UUID

data class MriResultDto(
    val mriImageId: UUID,
    val mriResultId: Long,
    val comment: String,
) {
}