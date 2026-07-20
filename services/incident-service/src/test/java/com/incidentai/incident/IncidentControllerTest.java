package com.incidentai.incident;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.incidentai.incident.entity.Incident;
import com.incidentai.incident.repository.IncidentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class IncidentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        incidentRepository.deleteAll();
    }

    @Test
    void shouldCreateIncidentSuccessfully() throws Exception {
        Map<String, String> request = Map.of(
            "title", "Database timeout in payment-service",
            "severity", "CRITICAL",
            "serviceName", "payment-service"
        );

        mockMvc.perform(post("/api/incidents")
            .header("x-user-id", "user_123")
            .header("x-organization-id", "org_default")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title")
                .value("Database timeout in payment-service"))
            .andExpect(jsonPath("$.status").value("OPEN"))
            .andExpect(jsonPath("$.severity").value("CRITICAL"))
            .andExpect(jsonPath("$.organizationId").value("org_default"))
            .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void shouldReturnBadRequestWhenTitleIsMissing() throws Exception {
        Map<String, String> request = Map.of(
            "severity", "CRITICAL"
        );

        mockMvc.perform(post("/api/incidents")
            .header("x-user-id", "user_123")
            .header("x-organization-id", "org_default")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Validation failed"));
    }

    @Test
    void shouldReturnAllIncidentsForOrganization() throws Exception {
        Incident incident = Incident.builder()
            .title("Test incident")
            .severity(Incident.Severity.HIGH)
            .status(Incident.Status.OPEN)
            .createdBy("user_123")
            .organizationId("org_default")
            .build();
        incidentRepository.save(incident);

        mockMvc.perform(get("/api/incidents")
            .header("x-organization-id", "org_default"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].title").value("Test incident"))
            .andExpect(jsonPath("$[0].organizationId").value("org_default"));
    }

    @Test
    void shouldNotReturnIncidentsFromOtherOrganization() throws Exception {
        Incident incident = Incident.builder()
            .title("Other org incident")
            .severity(Incident.Severity.HIGH)
            .status(Incident.Status.OPEN)
            .createdBy("user_456")
            .organizationId("org_other")
            .build();
        incidentRepository.save(incident);

        mockMvc.perform(get("/api/incidents")
            .header("x-organization-id", "org_default"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void shouldReturn404WhenAccessingOtherOrganizationIncident() throws Exception {
        Incident incident = Incident.builder()
            .title("Other org incident")
            .severity(Incident.Severity.HIGH)
            .status(Incident.Status.OPEN)
            .createdBy("user_456")
            .organizationId("org_other")
            .build();
        Incident saved = incidentRepository.save(incident);

        mockMvc.perform(get("/api/incidents/" + saved.getId())
            .header("x-organization-id", "org_default"))
            .andExpect(status().isNotFound());
    }

    @Test
    void shouldUpdateIncidentStatus() throws Exception {
        Incident incident = Incident.builder()
            .title("Test incident")
            .severity(Incident.Severity.HIGH)
            .status(Incident.Status.OPEN)
            .createdBy("user_123")
            .organizationId("org_default")
            .build();
        Incident saved = incidentRepository.save(incident);

        Map<String, String> request = Map.of("status", "INVESTIGATING");

        mockMvc.perform(patch("/api/incidents/" + saved.getId() + "/status")
            .header("x-organization-id", "org_default")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("INVESTIGATING"));
    }

    @Test
    void shouldAssignIncidentToUser() throws Exception {
        Incident incident = Incident.builder()
            .title("Test incident")
            .severity(Incident.Severity.HIGH)
            .status(Incident.Status.OPEN)
            .createdBy("user_123")
            .organizationId("org_default")
            .build();
        Incident saved = incidentRepository.save(incident);

        Map<String, String> request = Map.of("userId", "user_456");

        mockMvc.perform(patch("/api/incidents/" + saved.getId() + "/assign")
            .header("x-organization-id", "org_default")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.assignedTo").value("user_456"));
    }

    @Test
    void shouldReturnHealthCheck() throws Exception {
        mockMvc.perform(get("/api/incidents/health"))
            .andExpect(status().isOk());
    }
}