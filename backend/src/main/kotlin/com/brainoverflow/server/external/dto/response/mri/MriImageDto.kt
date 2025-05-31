package com.brainoverflow.server.external.dto.response.mri

import com.brainoverflow.server.domain.mri.MriImage
import com.brainoverflow.server.external.dto.request.mri.MriResultDto
import java.util.*

data class MriImageDto(
    val mriId: UUID,
    val filePath: String,
    val mriResultDtoList: List<MriResultDto>
) {
    companion object {
        fun from(mriImage: MriImage): MriImageDto {
            val mriResultDtoList = mriImage.mriResults.map(MriResultDto::fromDomain)
            return MriImageDto(
                mriId = mriImage.id!!,
                filePath = mriImage.filePath,
                mriResultDtoList = mriResultDtoList
            )
        }
    }
}
