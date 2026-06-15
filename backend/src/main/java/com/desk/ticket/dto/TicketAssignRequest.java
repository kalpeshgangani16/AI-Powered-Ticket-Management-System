package com.desk.ticket.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketAssignRequest {

    @NotNull(message = "Ticket ID is required")
    private Long ticketId;

    @NotNull(message = "User ID is required")
    private Long userId;
}
