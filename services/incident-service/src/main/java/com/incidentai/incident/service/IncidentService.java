package com.incidentai.incident.service;

import com.incidentai.incident.dto.*;
import com.incidentai.incident.entity.Incident;
import com.incidentai.incident.exception.IncidentNotFoundException;
import com.incidentai.incident.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;

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

    public IncidentResponse updateStatus(
            String id,
            UpdateStatusRequest request,
            String organizationId) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IncidentNotFoundException(id));

        if (!incident.getOrganizationId().equals(organizationId)) {
            throw new IncidentNotFoundException(id);
        }

        incident.setStatus(request.getStatus());
        Incident saved = incidentRepository.save(incident);
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
}