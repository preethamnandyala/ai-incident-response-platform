package com.incidentai.incident.service;

import com.incidentai.incident.dto.*;
import com.incidentai.incident.entity.Incident;
import com.incidentai.incident.entity.IncidentTimeline;
import com.incidentai.incident.exception.IncidentNotFoundException;
import com.incidentai.incident.repository.IncidentRepository;
import com.incidentai.incident.repository.IncidentTimelineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final IncidentTimelineRepository timelineRepository;

    public IncidentResponse createIncident(
            CreateIncidentRequest request,
            String createdBy,
            String organizationId) {

        Incident incident = Incident.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .severity(request.getSeverity())
                .status(Incident.Status.OPEN)
                .serviceName(request.getServiceName())
                .createdBy(createdBy)
                .organizationId(organizationId)
                .build();

        Incident saved = incidentRepository.save(incident);

        recordTimeline(
                saved.getId(),
                "INCIDENT_CREATED",
                createdBy,
                String.format("{\"title\": \"%s\", \"severity\": \"%s\"}",
                        saved.getTitle(), saved.getSeverity()),
                organizationId
        );

        return IncidentResponse.from(saved);
    }

    public List<IncidentResponse> getAllIncidents(String organizationId) {
        return incidentRepository
                .findByOrganizationIdOrderByCreatedAtDesc(organizationId)
                .stream()
                .map(IncidentResponse::from)
                .collect(Collectors.toList());
    }

    public IncidentResponse getIncidentById(
            String id,
            String organizationId) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IncidentNotFoundException(id));

        if (!incident.getOrganizationId().equals(organizationId)) {
            throw new IncidentNotFoundException(id);
        }

        return IncidentResponse.from(incident);
    }

    public List<TimelineResponse> getTimeline(
            String id,
            String organizationId) {
        // verify incident exists and belongs to org
        getIncidentById(id, organizationId);

        return timelineRepository
                .findByIncidentIdAndOrganizationIdOrderByCreatedAtAsc(
                        id, organizationId)
                .stream()
                .map(TimelineResponse::from)
                .collect(Collectors.toList());
    }

    public IncidentResponse updateStatus(
            String id,
            UpdateStatusRequest request,
            String organizationId) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IncidentNotFoundException(id));

        if (!incident.getOrganizationId().equals(organizationId)) {
            throw new IncidentNotFoundException(id);
        }

        String previousStatus = incident.getStatus().toString();
        incident.setStatus(request.getStatus());
        Incident saved = incidentRepository.save(incident);

        recordTimeline(
                id,
                "STATUS_CHANGED",
                "system",
                String.format("{\"from\": \"%s\", \"to\": \"%s\"}",
                        previousStatus, request.getStatus()),
                organizationId
        );

        return IncidentResponse.from(saved);
    }

    public IncidentResponse assignIncident(
            String id,
            AssignIncidentRequest request,
            String organizationId) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IncidentNotFoundException(id));

        if (!incident.getOrganizationId().equals(organizationId)) {
            throw new IncidentNotFoundException(id);
        }

        incident.setAssignedTo(request.getUserId());
        Incident saved = incidentRepository.save(incident);

        recordTimeline(
                id,
                "INCIDENT_ASSIGNED",
                "system",
                String.format("{\"assignedTo\": \"%s\"}", request.getUserId()),
                organizationId
        );

        return IncidentResponse.from(saved);
    }

    public void deleteIncident(String id, String organizationId) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IncidentNotFoundException(id));

        if (!incident.getOrganizationId().equals(organizationId)) {
            throw new IncidentNotFoundException(id);
        }

        incidentRepository.deleteById(id);
    }

    private void recordTimeline(
            String incidentId,
            String action,
            String performedBy,
            String details,
            String organizationId) {
        IncidentTimeline entry = IncidentTimeline.builder()
                .incidentId(incidentId)
                .action(action)
                .performedBy(performedBy)
                .details(details)
                .organizationId(organizationId)
                .build();
        timelineRepository.save(entry);
    }
}