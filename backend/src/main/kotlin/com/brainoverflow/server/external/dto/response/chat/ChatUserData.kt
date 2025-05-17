package com.brainoverflow.server.external.dto.response.chat

import java.util.UUID

data class ChatUserData(
    val userId: UUID,
    val nickname: String
) {
}