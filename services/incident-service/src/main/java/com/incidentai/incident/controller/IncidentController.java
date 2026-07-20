package com.incidentai.incident.controller;

import com.incidentai.incident.dto.*;
import com.incidentai.incident.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    @PostMapping
    public ResponseEntity<IncidentResponse> createIncident(
            @Valid @RequestBody CreateIncidentRequest request,
            @RequestHeader("x-user-id") String userId,
            @RequestHeader("x-organization-id") String organizationId) {
        IncidentResponse response = incidentService.createIncident(
            request, userId, organizationId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<IncidentResponse>> getAllIncidents(
            @RequestHeader("x-organization-id") String organizationId) {
        return ResponseEntity.ok(
            incidentService.getAllIncidents(organizationId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentResponse> getIncidentById(
            @PathVariable String id,
            @RequestHeader("x-organization-id") String organizationId) {
        return ResponseEntity.ok(
            incidentService.getIncidentById(id, organizationId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<IncidentResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateStatusRequest request,
            @RequestHeader("x-organization-id") String organizationId) {
        return ResponseEntity.ok(
            incidentService.updateStatus(id, request, organizationId));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<IncidentResponse> assignIncident(
            @PathVariable String id,
            @Valid @RequestBody AssignIncidentRequest request,
            @RequestHeader("x-organization-id") String organizationId) {
        return ResponseEntity.ok(
            incidentService.assignIncident(id, request, organizationId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncident(
            @PathVariable String id,
            @RequestHeader("x-organization-id") String organizationId) {
        incidentService.deleteIncident(id, organizationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("healthy");
    }
}