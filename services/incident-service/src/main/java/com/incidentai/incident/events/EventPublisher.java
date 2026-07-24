package com.incidentai.incident.events;

import com.incidentai.incident.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishIncidentCreated(
            String incidentId,
            String title,
            String severity,
            String serviceName,
            String organizationId) {

        Map<String, String> event = Map.of(
                "incidentId", incidentId,
                "title", title,
                "severity", severity,
                "serviceName", serviceName != null ? serviceName : "",
                "organizationId", organizationId,
                "event", "incident.created"
        );

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE,
                RabbitMQConfig.INCIDENT_CREATED_ROUTING_KEY,
                event
        );

        log.info("Published incident.created event for incident: {}",
                incidentId);
    }
}