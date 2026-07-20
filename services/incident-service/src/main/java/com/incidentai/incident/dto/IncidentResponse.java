package com.incidentai.incident.dto;

import com.incidentai.incident.entity.Incident;
import lombok.Data;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@Builder
public class IncidentResponse {

    private String id;
    private String title;
    private String description;
    private Incident.Severity severity;
    private Incident.Status status;
    private String serviceName;
    private String assignedTo;
    private String createdBy;
    private String organizationId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static IncidentResponse from(Incident incident) {
        return IncidentResponse.builder()
                .id(incident.getId())
                .title(incident.getTitle())
                .description(incident.getDescription())
                .severity(incident.getSeverity())
                .status(incident.getStatus())
                .serviceName(incident.getServiceName())
                .assignedTo(incident.getAssignedTo())
                .createdBy(incident.getCreatedBy())
                .organizationId(incident.getOrganizationId())
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .build();
    }
}