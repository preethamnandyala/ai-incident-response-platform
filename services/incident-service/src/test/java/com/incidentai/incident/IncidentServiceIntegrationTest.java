package com.incidentai.incident;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class IncidentServiceIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private HttpHeaders headers;
    private String baseUrl;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port;
        headers = new HttpHeaders();
        headers.set("X-Organization-Id", "org_default");
        headers.setContentType(MediaType.APPLICATION_JSON);
    }

    @Test
    @DisplayName("Health check should return healthy")
    void healthCheck_ShouldReturnHealthy() {
        ResponseEntity<String> response = restTemplate.getForEntity(
            baseUrl + "/api/incidents/health",
            String.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("GET /api/incidents should return list")
    void getIncidents_ShouldReturnList() {
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<List> response = restTemplate.exchange(
            baseUrl + "/api/incidents",
            HttpMethod.GET,
            request,
            List.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).isInstanceOf(List.class);
    }

    @Test
    @DisplayName("GET /api/incidents should filter by severity")
    void getIncidents_FilterBySeverity_ShouldReturnFiltered() {
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<List> response = restTemplate.exchange(
            baseUrl + "/api/incidents?severity=CRITICAL",
            HttpMethod.GET,
            request,
            List.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> incidents = response.getBody();
        assertThat(incidents).isNotNull();
        for (Map incident : incidents) {
            assertThat(incident.get("severity")).isEqualTo("CRITICAL");
        }
    }

    @Test
    @DisplayName("GET /api/incidents should filter by status")
    void getIncidents_FilterByStatus_ShouldReturnFiltered() {
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<List> response = restTemplate.exchange(
            baseUrl + "/api/incidents?status=OPEN",
            HttpMethod.GET,
            request,
            List.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> incidents = response.getBody();
        assertThat(incidents).isNotNull();
        for (Map incident : incidents) {
            assertThat(incident.get("status")).isEqualTo("OPEN");
        }
    }

    @Test
    @DisplayName("GET /api/incidents/{id} should return 404 for unknown id")
    void getIncidentById_UnknownId_ShouldReturn404() {
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            baseUrl + "/api/incidents/00000000-0000-0000-0000-000000000000",
            HttpMethod.GET,
            request,
            Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("PATCH status with invalid value should return error")
    void updateStatus_InvalidStatus_ShouldReturn400() {
        HttpEntity<String> request = new HttpEntity<>(
            "{\"status\": \"INVALID_STATUS\"}",
            headers
        );

        ResponseEntity<Map> response = restTemplate.exchange(
            baseUrl + "/api/incidents/00000000-0000-0000-0000-000000000000/status",
            HttpMethod.PATCH,
            request,
            Map.class
        );

        assertThat(response.getStatusCode().is4xxClientError()
        || response.getStatusCode().is5xxServerError()).isTrue();
    }

    @Test
    @DisplayName("GET /api/incidents should return empty list for unknown org")
    void getIncidents_UnknownOrg_ShouldReturnEmptyList() {
        HttpHeaders unknownOrgHeaders = new HttpHeaders();
        unknownOrgHeaders.set("X-Organization-Id", "org_unknown_xyz");
        HttpEntity<Void> request = new HttpEntity<>(unknownOrgHeaders);

        ResponseEntity<List> response = restTemplate.exchange(
            baseUrl + "/api/incidents",
            HttpMethod.GET,
            request,
            List.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }
}