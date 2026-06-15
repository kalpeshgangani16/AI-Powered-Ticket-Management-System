package com.desk.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiClassifyRequest {

    @NotBlank(message = "Description cannot be blank")
    private String description;
}
