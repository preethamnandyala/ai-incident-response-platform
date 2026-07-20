package com.incidentai.incident.repository;

import com.incidentai.incident.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, String> {

    List<Incident> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);

    List<Incident> findByOrganizationIdAndStatus(
        String organizationId, Incident.Status status);

    List<Incident> findByOrganizationIdAndSeverity(
        String organizationId, Incident.Severity severity);

    List<Incident> findByOrganizationIdAndAssignedTo(
        String organizationId, String userId);

    List<Incident> findByOrganizationIdAndServiceName(
        String organizationId, String serviceName);
}