package com.brainoverflow.server.external.ws

import com.brainoverflow.server.external.controller.auth.JwtProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.config.ChannelRegistration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.messaging.support.MessageBuilder
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    private val jwtProvider: JwtProvider,
    private val stompSessionInterceptor: StompSessionInterceptor,
) : WebSocketMessageBrokerConfigurer {

    override fun configureMessageBroker(registry: MessageBrokerRegistry) {
        // 1) Use the built-in simple broker on these prefixes:
        registry
            .enableSimpleBroker("/topic", "/queue")
            .setHeartbeatValue(longArrayOf(100000, 100000))   // server/client heartbeats (optional)
        // 2) Prefix for messages bound for @MessageMapping
        registry.setApplicationDestinationPrefixes("/app")
        // 3) Prefix for user-specific messages: convertAndSendToUser destinations
        registry.setUserDestinationPrefix("/user")
    }

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint("/ws")
            .setAllowedOrigins(
                "https://brain-overflow.unknownpgr.com",
                "https://api-brain-overflow.unknownpgr.com",
                "http://localhost:5173",
                "https://localhost:5173",
            )
            .addInterceptors(JwtHandshakeInterceptor(jwtProvider))
            .setHandshakeHandler(CustomHandshakeHandler())
            .withSockJS()
            .setDisconnectDelay(10_000)
            .setHeartbeatTime(300_000)
    }

    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(stompSessionInterceptor)
    }

    override fun configureClientOutboundChannel(registration: ChannelRegistration) {
        // You can keep your SUBSCRIBE interceptor if you like,
        // though the simple broker doesn’t support per-queue auto-delete
        registration.interceptors(object : ChannelInterceptor {
            override fun preSend(message: Message<*>, channel: MessageChannel): Message<*> {
                val accessor = StompHeaderAccessor.wrap(message)
                if (accessor.command == StompCommand.SUBSCRIBE) {
                    // no-op or add custom headers if needed
                }
                return MessageBuilder.createMessage(message.payload, accessor.messageHeaders)
            }
        })
    }
}
