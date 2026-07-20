package com.incidentai.incident.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssignIncidentRequest {

    @NotBlank(message = "User ID is required")
    private String userId;
}