package com.incidentai.incident.config;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String EXCHANGE = "incident_platform";

    public static final String LOG_CRITICAL_QUEUE = "log.critical.queue";
    public static final String INCIDENT_CREATED_QUEUE = "incident.created.queue";
    public static final String NOTIFICATION_INCIDENT_QUEUE = "notification.incident.queue";

    public static final String CRITICAL_LOG_ROUTING_KEY = "critical.log.detected";
    public static final String INCIDENT_CREATED_ROUTING_KEY = "incident.created";

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue logCriticalQueue() {
        return QueueBuilder.durable(LOG_CRITICAL_QUEUE).build();
    }

    @Bean
    public Queue incidentCreatedQueue() {
        return QueueBuilder.durable(INCIDENT_CREATED_QUEUE).build();
    }

    @Bean
    public Queue notificationIncidentQueue() {
        return QueueBuilder.durable(NOTIFICATION_INCIDENT_QUEUE).build();
    }

    @Bean
    public Binding logCriticalBinding() {
        return BindingBuilder
                .bind(logCriticalQueue())
                .to(exchange())
                .with(CRITICAL_LOG_ROUTING_KEY);
    }

    @Bean
    public Binding incidentCreatedBinding() {
        return BindingBuilder
                .bind(incidentCreatedQueue())
                .to(exchange())
                .with(INCIDENT_CREATED_ROUTING_KEY);
    }

    @Bean
    public Binding notificationIncidentBinding() {
        return BindingBuilder
                .bind(notificationIncidentQueue())
                .to(exchange())
                .with(INCIDENT_CREATED_ROUTING_KEY);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}