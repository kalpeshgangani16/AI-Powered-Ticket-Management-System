package com.desk.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStats {
    private long totalUsers;
    private long totalTickets;
    private long openTickets;
    private long inProgressTickets;
    private long resolvedTickets;
}
