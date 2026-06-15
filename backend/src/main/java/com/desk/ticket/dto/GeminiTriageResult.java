package com.desk.ticket.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeminiTriageResult {
    private String category;
    private String department;
    private String priority;
    private String engineerSkill;
    private String rootCause;
    private String assignmentHint;
    private List<String> aiResolution;
}
