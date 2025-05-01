package com.brainoverflow.server.external.dto.request.chat

import com.brainoverflow.server.domain.chat.ChatRoom
import com.brainoverflow.server.domain.user.User

data class CreateRoomDto(
    val roomName: String
) {
    fun toChatRoom(user: User): ChatRoom {
        return ChatRoom(
            name = roomName,
            owner = user
        )
    }

}
