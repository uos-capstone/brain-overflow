package com.brainoverflow.server.external.dto.response.user

import com.brainoverflow.server.domain.user.Role

data class UserInfo(
    val nickname: String,
    val role: Role,
    val username: String,
) {
}