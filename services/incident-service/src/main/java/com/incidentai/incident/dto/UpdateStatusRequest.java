package com.incidentai.incident.dto;

import com.incidentai.incident.entity.Incident;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateStatusRequest {

    @NotNull(message = "Status is required")
    private Incident.Status status;
}