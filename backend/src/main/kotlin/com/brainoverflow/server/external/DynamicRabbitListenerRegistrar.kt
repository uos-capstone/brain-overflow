package com.brainoverflow.server.external

import com.brainoverflow.server.external.dto.response.chat.SocketMessageResponse
import com.brainoverflow.server.external.ws.ServerIdProvider
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.amqp.core.AmqpAdmin
import org.springframework.amqp.core.BindingBuilder
import org.springframework.amqp.core.Queue
import org.springframework.amqp.core.TopicExchange
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerEndpoint
import org.springframework.amqp.rabbit.listener.RabbitListenerEndpointRegistry
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Component

@Component
class DynamicRabbitListenerRegistrar(
    private val listenerRegistry: RabbitListenerEndpointRegistry,
    private val containerFactory: SimpleRabbitListenerContainerFactory,
    private val serverIdProvider: ServerIdProvider,
    private val objectMapper: ObjectMapper,
    private val messagingTemplate: SimpMessagingTemplate,
    private val amqpAdmin: AmqpAdmin, // <- 추가
) {
    companion object {
        const val EXCHANGE_NAME = "ai.response.exchange"
        const val CHAT_EXCHANGE = "chat.exchange"
    }

    @EventListener(ApplicationReadyEvent::class)
    fun registerListener() {
        val serverId = serverIdProvider.get()
        val queueName = "ai.response.queue.$serverId"

        val queue = Queue(queueName, false, true, true)
        amqpAdmin.declareQueue(queue)

        val exchange = TopicExchange(EXCHANGE_NAME, true, true)
        amqpAdmin.declareExchange(exchange)

        val binding =
            BindingBuilder
                .bind(queue)
                .to(exchange)
                .with(queueName)
        amqpAdmin.declareBinding(binding)

        // 4) 리스너 컨테이너 등록
        val endpoint =
            SimpleRabbitListenerEndpoint().apply {
                id = "listener-$serverId"
                setQueueNames(queueName)
                setMessageListener { message ->
                    val json = objectMapper.readTree(String(message.body))
                    val userId = json["userId"].asText()
                    val resultId = json["resultId"].asText()
                    println("userID = $userId")
                    val fromAiResponse = SocketMessageResponse.fromAiResponse(resultId)
                    messagingTemplate.convertAndSendToUser(userId, "/queue/chat", fromAiResponse)
                }
            }
        listenerRegistry.registerListenerContainer(endpoint, containerFactory, true)
        println("[✓] Dynamic listener registered for $queueName")
    }

    @EventListener(ApplicationReadyEvent::class)
    fun registerChatListener() {
        val serverId = serverIdProvider.get()
        val queueName = "chat.queue.$serverId"

        // Exchange / Queue / Binding 선언
        amqpAdmin.declareExchange(TopicExchange(CHAT_EXCHANGE, true, true))
        amqpAdmin.declareQueue(Queue(queueName, false, true, true))
        amqpAdmin.declareBinding(
            BindingBuilder
                .bind(Queue(queueName))
                .to(TopicExchange(CHAT_EXCHANGE))
                .with("#"),
        )

        // Listener 등록
        val endpoint =
            SimpleRabbitListenerEndpoint().apply {
                id = "chat-listener-$serverId"
                setQueueNames(queueName)
                setMessageListener { message ->
                    // Map<String, Any> 형태로 역직렬화
                    val node = objectMapper.readTree(message.body)
                    val userIds = node["userIds"].map { it.asText() }
                    val chat =
                        objectMapper.treeToValue(
                            node["chat"],
                            SocketMessageResponse::class.java,
                        )

                    // Redis 없이, 바로 유저 리스트 순회
                    userIds.forEach { userId ->
                        messagingTemplate.convertAndSendToUser(
                            userId,
                            "/queue/chat",
                            chat,
                        )
                    }
                }
            }
        listenerRegistry.registerListenerContainer(endpoint, containerFactory, true)
    }
}
