package com.desk.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private String department;
    private String engineerSkill;
    private String rootCause;
    private String assignmentHint;
    private java.util.List<String> aiResolution;
    private UserSummaryDto createdBy;
    private UserSummaryDto assignedTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private java.util.List<AttachmentResponse> attachments;
}
