package com.brainoverflow.server.service.port

import com.brainoverflow.server.domain.mri.Gender
import com.brainoverflow.server.domain.mri.TargetDiagnosis
import java.util.*

data class MriPredicateData(
    val mriResultId: Long,
    val mriImageId: UUID,
    val imageURL: String,
    val lastAge: Int,
    val gender: Gender,
    val targetAge: Int,
    val targetDiagnosis: TargetDiagnosis
)
