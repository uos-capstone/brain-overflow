package com.brainoverflow.server.external

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
import org.springframework.web.socket.TextMessage

@Component
class DynamicRabbitListenerRegistrar(
    private val listenerRegistry: RabbitListenerEndpointRegistry,
    private val containerFactory: SimpleRabbitListenerContainerFactory,
    private val serverIdProvider: ServerIdProvider,
    private val objectMapper: ObjectMapper,
    private val messagingTemplate: SimpMessagingTemplate,
    private val amqpAdmin: AmqpAdmin       // <- 추가
) {

    companion object {
        const val EXCHANGE_NAME = "ai.response.exchange"
    }

    @EventListener(ApplicationReadyEvent::class)
    fun registerListener() {
        val serverId = serverIdProvider.get()
        val queueName = "ai.response.queue.$serverId"

        val queue = Queue(queueName, true)
        amqpAdmin.declareQueue(queue)

        val exchange = TopicExchange(EXCHANGE_NAME, true, true)
        amqpAdmin.declareExchange(exchange)

        val binding = BindingBuilder
            .bind(queue)
            .to(exchange)
            .with(queueName)
        amqpAdmin.declareBinding(binding)

        // 4) 리스너 컨테이너 등록
        val endpoint = SimpleRabbitListenerEndpoint().apply {
            id = "listener-$serverId"
            setQueueNames(queueName)
            setMessageListener { message ->
                val json = objectMapper.readTree(String(message.body))
                val userId = json["userId"].asText()
                val msg = json["message"].asText()
                val payload = mapOf(
                    "userId" to userId,
                    "message" to msg
                )
                messagingTemplate.convertAndSend("/topic/ai-response.$userId", payload)
            }
        }
        listenerRegistry.registerListenerContainer(endpoint, containerFactory, true)
        println("[✓] Dynamic listener registered for $queueName")
    }
}
