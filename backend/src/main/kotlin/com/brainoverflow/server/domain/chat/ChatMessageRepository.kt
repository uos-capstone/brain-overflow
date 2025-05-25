package com.brainoverflow.server.domain.chat

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.mongodb.repository.MongoRepository
import java.util.*

interface ChatMessageRepository : MongoRepository<ChatMessageDocument, UUID> {
    fun findByRoomIdOrderByCreatedAtAsc(
        roomId: UUID,
        pageable: Pageable,
    ): List<ChatMessageDocument>

    // 페이징 & 정렬 지원
    fun findByRoomId(
        roomId: Long,
        pageable: Pageable,
    ): Page<ChatMessageDocument>
}
