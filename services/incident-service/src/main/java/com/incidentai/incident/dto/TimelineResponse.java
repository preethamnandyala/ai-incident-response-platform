package com.incidentai.incident.dto;

import com.incidentai.incident.entity.IncidentTimeline;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TimelineResponse {

    private String id;
    private String incidentId;
    private String action;
    private String performedBy;
    private String details;
    private String organizationId;
    private LocalDateTime createdAt;

    public static TimelineResponse from(IncidentTimeline timeline) {
        return TimelineResponse.builder()
                .id(timeline.getId())
                .incidentId(timeline.getIncidentId())
                .action(timeline.getAction())
                .performedBy(timeline.getPerformedBy())
                .details(timeline.getDetails())
                .organizationId(timeline.getOrganizationId())
                .createdAt(timeline.getCreatedAt())
                .build();
    }
}