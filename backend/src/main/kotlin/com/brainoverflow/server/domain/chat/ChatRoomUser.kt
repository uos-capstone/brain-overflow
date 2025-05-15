package com.brainoverflow.server.domain.chat

import com.brainoverflow.server.domain.user.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
class ChatRoomUser(
    @Id @GeneratedValue val id: Long = 0,
    @ManyToOne(fetch = FetchType.LAZY) val chatRoom: ChatRoom,
    @ManyToOne(fetch = FetchType.LAZY) val user: User,
    val invitedAt: LocalDateTime = LocalDateTime.now()
) {
}