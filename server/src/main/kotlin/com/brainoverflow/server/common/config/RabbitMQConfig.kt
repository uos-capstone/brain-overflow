package com.brainoverflow.server.common.config

import org.springframework.amqp.core.Binding
import org.springframework.amqp.core.BindingBuilder
import org.springframework.amqp.core.FanoutExchange
import org.springframework.amqp.core.Queue
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration


@Configuration
class RabbitMQConfig {
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
}
