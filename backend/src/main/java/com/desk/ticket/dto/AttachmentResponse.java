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
public class AttachmentResponse {
    private Long id;
    private Long ticketId;
    private String fileName;
    private String fileType;
    private LocalDateTime createdAt;
}
