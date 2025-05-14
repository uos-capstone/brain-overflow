package com.brainoverflow.server.external.dto.response.mri

import com.brainoverflow.server.domain.mri.MriImage
import java.util.*

data class MriImageDto(
    val mriId: UUID,
    val filePath: String,
) {
    companion object {
        fun from(mriImage: MriImage): MriImageDto {
            return MriImageDto(
                mriId = mriImage.id!!,
                filePath = mriImage.filePath,
            )
        }
    }
}