package com.incidentai.incident;

import com.incidentai.incident.dto.AssignIncidentRequest;
import com.incidentai.incident.dto.CreateIncidentRequest;
import com.incidentai.incident.dto.IncidentResponse;
import com.incidentai.incident.dto.TimelineResponse;
import com.incidentai.incident.dto.UpdateStatusRequest;
import com.incidentai.incident.entity.Incident;
import com.incidentai.incident.entity.IncidentTimeline;
import com.incidentai.incident.exception.IncidentNotFoundException;
import com.incidentai.incident.repository.IncidentRepository;
import com.incidentai.incident.repository.IncidentTimelineRepository;
import com.incidentai.incident.service.IncidentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceUnitTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private IncidentTimelineRepository timelineRepository;

    @InjectMocks
    private IncidentService incidentService;

    private Incident mockIncident;

    @BeforeEach
    void setUp() {
        mockIncident = Incident.builder()
                .id("incident_123")
                .title("DB timeout")
                .severity(Incident.Severity.CRITICAL)
                .status(Incident.Status.OPEN)
                .createdBy("user_123")
                .organizationId("org_default")
                .build();
    }

    @Test
    void shouldCreateIncidentWithStatusOpen() {
        CreateIncidentRequest request = new CreateIncidentRequest();
        request.setTitle("DB timeout");
        request.setSeverity(Incident.Severity.CRITICAL);

        when(incidentRepository.save(any(Incident.class)))
                .thenReturn(mockIncident);
        when(timelineRepository.save(any(IncidentTimeline.class)))
                .thenReturn(new IncidentTimeline());

        IncidentResponse response = incidentService
                .createIncident(request, "user_123", "org_default");

        assertThat(response.getStatus()).isEqualTo(Incident.Status.OPEN);
        assertThat(response.getTitle()).isEqualTo("DB timeout");
        assertThat(response.getOrganizationId()).isEqualTo("org_default");
        verify(incidentRepository, times(1)).save(any(Incident.class));
        verify(timelineRepository, times(1)).save(any(IncidentTimeline.class));
    }

    @Test
    void shouldSetOrganizationIdOnCreation() {
        CreateIncidentRequest request = new CreateIncidentRequest();
        request.setTitle("Test incident");
        request.setSeverity(Incident.Severity.LOW);

        when(incidentRepository.save(any(Incident.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(timelineRepository.save(any(IncidentTimeline.class)))
                .thenReturn(new IncidentTimeline());

        IncidentResponse response = incidentService
                .createIncident(request, "user_123", "org_abc");

        assertThat(response.getOrganizationId()).isEqualTo("org_abc");
    }

    @Test
    void shouldGetAllIncidentsForOrganization() {
        when(incidentRepository
                .findByOrganizationIdOrderByCreatedAtDesc("org_default"))
                .thenReturn(List.of(mockIncident));

        List<IncidentResponse> responses = incidentService
                .getAllIncidents("org_default");

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getTitle()).isEqualTo("DB timeout");
        verify(incidentRepository)
                .findByOrganizationIdOrderByCreatedAtDesc("org_default");
    }

    @Test
    void shouldGetIncidentByIdWhenOrganizationMatches() {
        when(incidentRepository.findById("incident_123"))
                .thenReturn(Optional.of(mockIncident));

        IncidentResponse response = incidentService
                .getIncidentById("incident_123", "org_default");

        assertThat(response.getId()).isEqualTo("incident_123");
    }

    @Test
    void shouldThrowWhenIncidentNotFound() {
        when(incidentRepository.findById("nonexistent"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                incidentService.getIncidentById("nonexistent", "org_default"))
                .isInstanceOf(IncidentNotFoundException.class)
                .hasMessageContaining("nonexistent");
    }

    @Test
    void shouldThrowWhenAccessingOtherOrganizationIncident() {
        when(incidentRepository.findById("incident_123"))
                .thenReturn(Optional.of(mockIncident));

        assertThatThrownBy(() ->
                incidentService.getIncidentById("incident_123", "org_other"))
                .isInstanceOf(IncidentNotFoundException.class);
    }

    @Test
    void shouldUpdateStatus() {
        UpdateStatusRequest request = new UpdateStatusRequest();
        request.setStatus(Incident.Status.INVESTIGATING);

        Incident updated = Incident.builder()
                .id("incident_123")
                .title("DB timeout")
                .severity(Incident.Severity.CRITICAL)
                .status(Incident.Status.INVESTIGATING)
                .createdBy("user_123")
                .organizationId("org_default")
                .build();

        when(incidentRepository.findById("incident_123"))
                .thenReturn(Optional.of(mockIncident));
        when(incidentRepository.save(any(Incident.class)))
                .thenReturn(updated);
        when(timelineRepository.save(any(IncidentTimeline.class)))
                .thenReturn(new IncidentTimeline());

        IncidentResponse response = incidentService
                .updateStatus("incident_123", request, "org_default");

        assertThat(response.getStatus())
                .isEqualTo(Incident.Status.INVESTIGATING);
        verify(timelineRepository).save(any(IncidentTimeline.class));
    }

    @Test
    void shouldThrowWhenUpdatingStatusOfOtherOrganizationIncident() {
        UpdateStatusRequest request = new UpdateStatusRequest();
        request.setStatus(Incident.Status.INVESTIGATING);

        when(incidentRepository.findById("incident_123"))
                .thenReturn(Optional.of(mockIncident));

        assertThatThrownBy(() ->
                incidentService.updateStatus(
                        "incident_123", request, "org_other"))
                .isInstanceOf(IncidentNotFoundException.class);
    }

    @Test
    void shouldAssignIncident() {
        AssignIncidentRequest request = new AssignIncidentRequest();
        request.setUserId("user_456");

        Incident assigned = Incident.builder()
                .id("incident_123")
                .title("DB timeout")
                .severity(Incident.Severity.CRITICAL)
                .status(Incident.Status.OPEN)
                .createdBy("user_123")
                .assignedTo("user_456")
                .organizationId("org_default")
                .build();

        when(incidentRepository.findById("incident_123"))
                .thenReturn(Optional.of(mockIncident));
        when(incidentRepository.save(any(Incident.class)))
                .thenReturn(assigned);
        when(timelineRepository.save(any(IncidentTimeline.class)))
                .thenReturn(new IncidentTimeline());

        IncidentResponse response = incidentService
                .assignIncident("incident_123", request, "org_default");

        assertThat(response.getAssignedTo()).isEqualTo("user_456");
        verify(timelineRepository).save(any(IncidentTimeline.class));
    }

    @Test
    void shouldDeleteIncident() {
        when(incidentRepository.findById("incident_123"))
                .thenReturn(Optional.of(mockIncident));
        doNothing().when(incidentRepository).deleteById("incident_123");

        incidentService.deleteIncident("incident_123", "org_default");

        verify(incidentRepository).deleteById("incident_123");
        verify(timelineRepository, never()).save(any());
    }

    @Test
    void shouldThrowWhenDeletingOtherOrganizationIncident() {
        when(incidentRepository.findById("incident_123"))
                .thenReturn(Optional.of(mockIncident));

        assertThatThrownBy(() ->
                incidentService.deleteIncident("incident_123", "org_other"))
                .isInstanceOf(IncidentNotFoundException.class);

        verify(incidentRepository, never()).deleteById(any());
    }

    @Test
    void shouldReturnTimelineForIncident() {
        IncidentTimeline entry = IncidentTimeline.builder()
                .id("timeline_1")
                .incidentId("incident_123")
                .action("INCIDENT_CREATED")
                .performedBy("user_123")
                .organizationId("org_default")
                .build();

        when(incidentRepository.findById("incident_123"))
                .thenReturn(Optional.of(mockIncident));
        when(timelineRepository
                .findByIncidentIdAndOrganizationIdOrderByCreatedAtAsc(
                        "incident_123", "org_default"))
                .thenReturn(List.of(entry));

        List<TimelineResponse> timeline = incidentService
                .getTimeline("incident_123", "org_default");

        assertThat(timeline).hasSize(1);
        assertThat(timeline.get(0).getAction())
                .isEqualTo("INCIDENT_CREATED");
    }
}