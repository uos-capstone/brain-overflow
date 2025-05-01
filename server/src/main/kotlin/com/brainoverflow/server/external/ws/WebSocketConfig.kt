package com.brainoverflow.server.external.ws

import com.brainoverflow.server.external.controller.auth.JwtProvider
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.messaging.simp.config.ChannelRegistration
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer

@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig(
    private val jwtProvider: JwtProvider,
    private val redisTemplate: StringRedisTemplate,
    private val serverIdProvider: ServerIdProvider,
    @Value("\${spring.rabbitmq.host}") private val host: String,
) : WebSocketMessageBrokerConfigurer {

    override fun configureMessageBroker(registry: MessageBrokerRegistry) {
        // 내부 메시지 브로커 대신, 오직 RabbitMQ STOMP Broker Relay를 사용합니다.
        registry.enableStompBrokerRelay("/topic", "/queue")
            .setRelayHost(host)         // RabbitMQ 호스트 (예: 로컬 환경에서는 "localhost")
            .setRelayPort(61613)               // RabbitMQ STOMP 포트 (RabbitMQ STOMP 플러그인 포트를 설정합니다.)
            .setClientLogin("guest")
            .setClientPasscode("guest")
        registry.setUserDestinationPrefix("/user")
        // 클라이언트가 애플리케이션 컨트롤러로 보내는 메시지는 "/app"으로 시작해야 합니다.
        registry.setApplicationDestinationPrefixes("/app")
    }

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        // SockJS fallback 지원하는 엔드포인트 등록. 모든 클라이언트는 '/ws-chat' 엔드포인트를 사용합니다.
        registry.addEndpoint("/ws")
            .addInterceptors(JwtHandshakeInterceptor(jwtProvider))
            .setHandshakeHandler(CustomHandshakeHandler())
            .withSockJS()
            .setDisconnectDelay(10_000)
            .setHeartbeatTime(300_000)
    }


    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        registration.interceptors(
            StompSessionInterceptor(redisTemplate, serverIdProvider)
        )
    }
}

