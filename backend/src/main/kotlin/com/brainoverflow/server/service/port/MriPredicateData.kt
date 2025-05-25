package com.brainoverflow.server.service.port

import com.brainoverflow.server.domain.mri.Gender

data class MriPredicateData(
    val mriResultId: Long,
    val imageURL: String,
    val lastAge: Int,
    val gender: Gender,
    val targetAge: Int,
)
