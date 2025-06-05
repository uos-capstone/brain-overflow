package com.brainoverflow.server.external.ws

import com.brainoverflow.server.service.chatroom.ChatRoomService
import org.slf4j.LoggerFactory
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.messaging.support.MessageBuilder
import org.springframework.stereotype.Component
import java.time.Duration
import java.util.*

@Component
class StompSessionInterceptor(
    private val redis: StringRedisTemplate,
    private val serverIdProvider: ServerIdProvider,
    private val chatRoomService: ChatRoomService, // DB에서 방 조회용
) : ChannelInterceptor {
    companion object {
        const val USER_SERVER_KEY = "ws:user:%s"
        const val ROOM_USERS_KEY = "room:%s:users"
        private val log = LoggerFactory.getLogger(StompSessionInterceptor::class.java)
    }

    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
        val accessor = StompHeaderAccessor.wrap(message)

        // sessionAttributes 없으면 건너뛰기
        val userId = accessor.sessionAttributes?.get("userId") as? UUID
            ?: return message

        try {
            when (accessor.command) {
                StompCommand.CONNECT -> {
                    // ▶ CONNECT만 재생성
                    log.info("UserId = $userId")
                    val serverId = serverIdProvider.get()
                    redis.opsForValue()
                        .set(USER_SERVER_KEY.format(userId), serverId, Duration.ofMinutes(60))
                    chatRoomService.getUsersChatList(userId).forEach { roomDto ->
                        redis.opsForSet()
                            .add(ROOM_USERS_KEY.format(roomDto.roomId), userId.toString())
                    }
                }

                StompCommand.DISCONNECT -> {
                    log.info("Stomp Disconnect + userId = $userId")
                    // ▶ DISCONNECT는 로직만 수행하고 원본 그대로 리턴
                    redis.delete(USER_SERVER_KEY.format(userId))
                    chatRoomService.getUsersChatList(userId).forEach { roomDto ->
                        redis.opsForSet()
                            .remove(ROOM_USERS_KEY.format(roomDto.roomId), userId.toString())
                    }

                }

                else -> {
                    // ▶ 그 외 프레임은 절대 건드리지 않고 원본 그대로 리턴
                    return message
                }
            }
        } catch (e: Exception) {
            log.error("STOMP 처리 중 예외 발생: ${e.message}", e)
            return null
        }
        return message
    }

}
