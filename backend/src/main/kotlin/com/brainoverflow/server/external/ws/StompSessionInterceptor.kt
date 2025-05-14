package com.brainoverflow.server.external.ws

import com.brainoverflow.server.service.chat.ChatRoomService
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.stereotype.Component
import java.time.Duration
import java.util.*

@Component
class StompSessionInterceptor(
    private val redis: StringRedisTemplate,
    private val serverIdProvider: ServerIdProvider,
    private val chatRoomService: ChatRoomService  // DB에서 방 조회용
) : ChannelInterceptor {

    companion object {
        private const val USER_SERVER_KEY = "ws:user:%s"
        private const val ROOM_USERS_KEY = "room:%s:users"
    }

    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*> {
        val accessor = StompHeaderAccessor.wrap(message)
        val userId = accessor.sessionAttributes?.get("userId") as? UUID ?: return message

        when (accessor.command) {
            StompCommand.CONNECT -> {
                // 1) 서버 매핑
                val serverId = serverIdProvider.get()
                redis.opsForValue()
                    .set(USER_SERVER_KEY.format(userId), serverId, Duration.ofMinutes(60))

                // 2) 내가 속한 모든 방을 DB에서 꺼내와서 Redis에 저장
                chatRoomService.getAllUserChatRooms(userId)
                    .forEach { roomDto ->
                        println(roomDto.roomId)
                        redis.opsForSet()
                            .add(ROOM_USERS_KEY.format(roomDto.roomId), userId.toString())
                    }
            }

            StompCommand.DISCONNECT -> {
                // 기존과 동일하게 서버 매핑만 지우면 됩니다
                redis.delete(USER_SERVER_KEY.format(userId))
            }

            else -> { /* SUBSCRIBE/UNSUBSCRIBE 로직은 제거 */
            }
        }
        return message
    }
}
