package com.incidentai.incident.repository;

import com.incidentai.incident.entity.IncidentTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentTimelineRepository
        extends JpaRepository<IncidentTimeline, String> {

    List<IncidentTimeline> findByIncidentIdAndOrganizationIdOrderByCreatedAtAsc(
            String incidentId, String organizationId);
}