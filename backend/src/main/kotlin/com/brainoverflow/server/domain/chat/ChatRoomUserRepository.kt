package com.brainoverflow.server.domain.chat

import com.brainoverflow.server.domain.user.User
import org.springframework.data.jpa.repository.JpaRepository

interface ChatRoomUserRepository : JpaRepository<ChatRoomUser, Long> {
    fun findByUserAndChatRoom(
        user: User,
        chatRoom: ChatRoom,
    ): ChatRoomUser?

    fun findByUser(user: User): List<ChatRoomUser>
}
