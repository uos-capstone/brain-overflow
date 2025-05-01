package com.brainoverflow.server.external.dto.request.mri

import java.util.UUID

data class MriResultDto(
    val mriImageId: UUID,
    val mriResultId: Long,
    val comment: String,
) {
}