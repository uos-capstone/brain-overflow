package com.brainoverflow.server.common.config

import org.springframework.amqp.core.*
import org.springframework.amqp.rabbit.annotation.EnableRabbit
import org.springframework.amqp.rabbit.connection.ConnectionFactory
import org.springframework.amqp.rabbit.core.RabbitAdmin
import org.springframework.amqp.rabbit.core.RabbitTemplate
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration


@Configuration
@EnableRabbit
class RabbitMQConfig {

    @Bean
    fun rabbitAdmin(connectionFactory: ConnectionFactory): RabbitAdmin {
        return RabbitAdmin(connectionFactory)
    }

    // Fanout Exchange를 사용하여 모든 바인딩된 큐로 메시지 전송
    @Bean
    fun fanoutExchange(): FanoutExchange {
        return FanoutExchange("AlzheimerAiFinishQueue")
    }

    @Bean
    fun aiQueueExchange(): FanoutExchange {
        return FanoutExchange("AlzheimerAiQueue")
    }

    // 문자 알림 큐
    @Bean
    fun aiCompleteQueue(): Queue {
        return Queue("aiCompleteQueue", true)
    }

    // 문자 알림 큐와 fanout exchange 바인딩
    @Bean
    fun aiCompleteBinding(aiCompleteQueue: Queue, fanoutExchange: FanoutExchange): Binding {
        return BindingBuilder.bind(aiCompleteQueue).to(fanoutExchange)
    }

    @Bean
    fun jsonMessageConverter(): Jackson2JsonMessageConverter {
        return Jackson2JsonMessageConverter()
    }


    // 채팅
    companion object {
        // RabbitMQ의 큐 이름, 익스체인지 이름, 라우팅 키를 상수로 정의합니다.
        const val QUEUE_NAME = "chat.queue"
        const val EXCHANGE_NAME = "chat.exchange"
        const val ROUTING_KEY = "chat.message"
    }

    /**
     * 내구성 큐 생성
     * 내구성 큐는 RabbitMQ가 재시작되더라도 큐가 유지되도록 합니다.
     */
    @Bean
    fun queue(): Queue = Queue(QUEUE_NAME, true)

    /**
     * 토픽 익스체인지 생성
     * 토픽 익스체인지는 라우팅 키 패턴을 기반으로 메시지를 라우팅할 수 있습니다.
     */
    @Bean
    fun exchange(): TopicExchange = TopicExchange(EXCHANGE_NAME)

    /**
     * 큐와 익스체인지를 라우팅 키를 통해 바인딩(binding)합니다.
     * 모든 메시지가 지정된 라우팅 키("chat.message")를 통해 큐에 전달됩니다.
     */
    @Bean
    fun binding(queue: Queue, exchange: TopicExchange): Binding =
        BindingBuilder.bind(queue).to(exchange).with(ROUTING_KEY)


}
