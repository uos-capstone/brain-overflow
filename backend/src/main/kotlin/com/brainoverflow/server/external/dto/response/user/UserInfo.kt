package com.brainoverflow.server.external.dto.response.user

import com.brainoverflow.server.domain.user.Role
import java.util.*

data class UserInfo(
    val id: UUID,
    val nickname: String,
    val role: Role,
    val username: String,
)
