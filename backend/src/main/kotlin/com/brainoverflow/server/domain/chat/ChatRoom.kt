package com.brainoverflow.server.domain.chat

import com.brainoverflow.server.domain.user.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
class ChatRoom(
    @Id @GeneratedValue val id: Long = 0,
    val name: String,
    @ManyToOne(fetch = FetchType.LAZY) val owner: User,
    @OneToMany(cascade = [(CascadeType.ALL)], mappedBy = "chatRoom")
    val chatRoomUser: List<ChatRoomUser> = listOf(),
    val createdAt: LocalDateTime = LocalDateTime.now(),
)
