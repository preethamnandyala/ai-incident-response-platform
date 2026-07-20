package com.incidentai.incident;

import com.incidentai.incident.entity.Incident;
import com.incidentai.incident.repository.IncidentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class IncidentRepositoryTest {

    @Autowired
    private IncidentRepository incidentRepository;

    @BeforeEach
    void setUp() {
        incidentRepository.deleteAll();
    }

    @Test
    void shouldFindIncidentsByOrganizationId() {
        Incident incident1 = Incident.builder()
                .title("Incident 1")
                .severity(Incident.Severity.HIGH)
                .status(Incident.Status.OPEN)
                .createdBy("user_123")
                .organizationId("org_default")
                .build();

        Incident incident2 = Incident.builder()
                .title("Incident 2")
                .severity(Incident.Severity.LOW)
                .status(Incident.Status.OPEN)
                .createdBy("user_456")
                .organizationId("org_other")
                .build();

        incidentRepository.save(incident1);
        incidentRepository.save(incident2);

        List<Incident> results = incidentRepository
                .findByOrganizationIdOrderByCreatedAtDesc("org_default");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("Incident 1");
    }

    @Test
    void shouldFindIncidentsByOrganizationIdAndStatus() {
        Incident open = Incident.builder()
                .title("Open incident")
                .severity(Incident.Severity.HIGH)
                .status(Incident.Status.OPEN)
                .createdBy("user_123")
                .organizationId("org_default")
                .build();

        Incident resolved = Incident.builder()
                .title("Resolved incident")
                .severity(Incident.Severity.LOW)
                .status(Incident.Status.RESOLVED)
                .createdBy("user_123")
                .organizationId("org_default")
                .build();

        incidentRepository.save(open);
        incidentRepository.save(resolved);

        List<Incident> results = incidentRepository
                .findByOrganizationIdAndStatus(
                        "org_default", Incident.Status.OPEN);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("Open incident");
    }

    @Test
    void shouldReturnEmptyListWhenNoIncidentsForOrganization() {
        List<Incident> results = incidentRepository
                .findByOrganizationIdOrderByCreatedAtDesc("org_nonexistent");

        assertThat(results).isEmpty();
    }

    @Test
    void shouldFindIncidentsByOrganizationIdAndSeverity() {
        Incident critical = Incident.builder()
                .title("Critical incident")
                .severity(Incident.Severity.CRITICAL)
                .status(Incident.Status.OPEN)
                .createdBy("user_123")
                .organizationId("org_default")
                .build();

        Incident low = Incident.builder()
                .title("Low incident")
                .severity(Incident.Severity.LOW)
                .status(Incident.Status.OPEN)
                .createdBy("user_123")
                .organizationId("org_default")
                .build();

        incidentRepository.save(critical);
        incidentRepository.save(low);

        List<Incident> results = incidentRepository
                .findByOrganizationIdAndSeverity(
                        "org_default", Incident.Severity.CRITICAL);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("Critical incident");
    }
}