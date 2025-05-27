package com.brainoverflow.server.domain.chat

import org.springframework.data.jpa.repository.JpaRepository

interface ChatRoomRepository : JpaRepository<ChatRoom, Long> {
    fun name(name: String): MutableList<ChatRoom>
}
