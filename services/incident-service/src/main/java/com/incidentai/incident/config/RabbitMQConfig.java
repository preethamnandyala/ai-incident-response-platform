package com.incidentai.incident.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Exchange name
    public static final String EXCHANGE = "incident_platform";

    // Queue names
    public static final String LOG_CRITICAL_QUEUE = "log.critical.queue";
    public static final String INCIDENT_CREATED_QUEUE = "incident.created.queue";

    // Routing keys
    public static final String CRITICAL_LOG_ROUTING_KEY = "critical.log.detected";
    public static final String INCIDENT_CREATED_ROUTING_KEY = "incident.created";

    // Topic exchange — routes by pattern matching on routing key
    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    // Queue for critical log events
    @Bean
    public Queue logCriticalQueue() {
        return QueueBuilder
                .durable(LOG_CRITICAL_QUEUE)
                .build();
    }

    // Queue for incident created events
    @Bean
    public Queue incidentCreatedQueue() {
        return QueueBuilder
                .durable(INCIDENT_CREATED_QUEUE)
                .build();
    }

    // Bind critical log queue to exchange
    @Bean
    public Binding logCriticalBinding() {
        return BindingBuilder
                .bind(logCriticalQueue())
                .to(exchange())
                .with(CRITICAL_LOG_ROUTING_KEY);
    }

    // Bind incident created queue to exchange
    @Bean
    public Binding incidentCreatedBinding() {
        return BindingBuilder
                .bind(incidentCreatedQueue())
                .to(exchange())
                .with(INCIDENT_CREATED_ROUTING_KEY);
    }

    // JSON message converter
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    // RabbitTemplate with JSON converter
    @Bean
    public RabbitTemplate rabbitTemplate(
            ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}