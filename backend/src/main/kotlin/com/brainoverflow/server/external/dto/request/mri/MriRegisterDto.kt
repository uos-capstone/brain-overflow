package com.brainoverflow.server.external.dto.request.mri

import com.brainoverflow.server.domain.mri.Gender

data class MriRegisterDto(
    val age: Int,
    val gender: Gender,
)
