package com.brainoverflow.server.domain.chat

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.CrudRepository

interface ChatRoomRepository : JpaRepository<ChatRoom, Long> {
}