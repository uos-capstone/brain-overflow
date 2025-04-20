package com.brainoverflow.server.api.dto.response.user

import java.util.*

data class TokenResponse(
    val token: String,
    val userId: UUID,
)
