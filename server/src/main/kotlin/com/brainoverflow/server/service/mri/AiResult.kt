package com.brainoverflow.server.service.mri

data class AiResult(
    val id: Long,
    val status: String,
    val score: Double
)
