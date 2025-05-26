package com.brainoverflow.server.external.dto.request.user

data class LoginRequest(
    val username: String,
    val password: String,
)
