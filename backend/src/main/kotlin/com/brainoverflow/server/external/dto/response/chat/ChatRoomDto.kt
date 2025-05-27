package com.brainoverflow.server.external.dto.response.chat

import com.brainoverflow.server.domain.chat.ChatRoom
import java.time.LocalDateTime

data class ChatRoomDto(
    val roomId: Long,
    val roomName: String,
    val roomUserNumber: Int,
    val lastMessage: String?,
    val lastMessageTime: LocalDateTime,
) {
    companion object {
        fun from(
            chatRoom: ChatRoom,
            content: List<SocketMessageResponse>,
        ): ChatRoomDto {
            return ChatRoomDto(
                chatRoom.id,
                chatRoom.name,
                chatRoom.chatRoomUser.size,
                content.firstOrNull()?.content ?: " ",
                content.firstOrNull()?.timestamp ?: LocalDateTime.now(),
            )
        }
    }
}
