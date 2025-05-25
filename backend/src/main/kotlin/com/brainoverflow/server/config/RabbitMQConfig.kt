package com.brainoverflow.server.config

import org.springframework.amqp.core.*
import org.springframework.amqp.rabbit.annotation.EnableRabbit
import org.springframework.amqp.rabbit.connection.ConnectionFactory
import org.springframework.amqp.rabbit.core.RabbitAdmin
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
    fun aiCompleteBinding(
        aiCompleteQueue: Queue,
        fanoutExchange: FanoutExchange,
    ): Binding {
        return BindingBuilder.bind(aiCompleteQueue).to(fanoutExchange)
    }

    @Bean
    fun jsonMessageConverter(): Jackson2JsonMessageConverter {
        return Jackson2JsonMessageConverter()
    }
}
