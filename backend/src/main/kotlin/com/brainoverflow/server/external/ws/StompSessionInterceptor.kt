package com.brainoverflow.server.external.ws

import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import java.time.Duration
import java.util.*

class StompSessionInterceptor(
    private val redisTemplate: StringRedisTemplate,
    private val serverIdProvider: ServerIdProvider
) : ChannelInterceptor {

    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*> {
        val accessor = StompHeaderAccessor.wrap(message)
        when (accessor.command) {
            StompCommand.CONNECT -> {
                val userId = accessor.sessionAttributes?.get("userId") as? UUID
                if (userId.toString().isNotBlank()) {
                    val serverId = serverIdProvider.get()
                    redisTemplate.opsForValue()
                        .set("ws:user:${userId.toString()}", serverId, Duration.ofMinutes(60))
                }
            }

            StompCommand.DISCONNECT -> {
                val userId = accessor.sessionAttributes?.get("userId") as? String
                if (!userId.isNullOrBlank()) {
                    redisTemplate.delete("ws:user:$userId")
                }
            }

            else -> {
                // SUBSCRIBE/UNSUBSCRIBE 쪽에서 필요하면 추가 로직
            }
        }
        return message
    }
}
