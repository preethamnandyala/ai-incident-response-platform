package com.incidentai.incident.events;

import com.incidentai.incident.config.RabbitMQConfig;
import com.incidentai.incident.dto.CreateIncidentRequest;
import com.incidentai.incident.entity.Incident;
import com.incidentai.incident.service.IncidentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventConsumer {

    private final IncidentService incidentService;
    private final EventPublisher eventPublisher;

    @RabbitListener(queues = RabbitMQConfig.LOG_CRITICAL_QUEUE)
    public void handleCriticalLog(Map<String, String> event) {
        log.info("Received critical.log.detected event: {}", event);

        try {
            String serviceName = event.get("serviceName");
            String message = event.get("message");
            String organizationId = event.getOrDefault(
                    "organizationId", "org_default");
            String logId = event.getOrDefault("logId", "");

            CreateIncidentRequest request = new CreateIncidentRequest();
            request.setTitle(String.format(
                    "CRITICAL: %s in %s", message, serviceName));
            request.setDescription(String.format(
                    "Auto-created from critical log. Log ID: %s", logId));
            request.setSeverity(Incident.Severity.CRITICAL);
            request.setServiceName(serviceName);

            var incident = incidentService.createIncident(
                    request, "system", organizationId);

            log.info("Auto-created incident: {}", incident.getId());

            eventPublisher.publishIncidentCreated(
                    incident.getId(),
                    incident.getTitle(),
                    incident.getSeverity().toString(),
                    incident.getServiceName(),
                    organizationId
            );

        } catch (Exception e) {
            log.error("Failed to process critical.log event: {}",
                    e.getMessage());
        }
    }
}