package com.desk.ticket.controller;

import com.desk.ticket.dto.TicketCreateRequest;
import com.desk.ticket.dto.TicketResponse;
import com.desk.ticket.dto.TicketUpdateRequest;
import com.desk.ticket.dto.UserDashboardStats;
import com.desk.ticket.entity.Role;
import com.desk.ticket.entity.User;
import com.desk.ticket.security.CustomUserDetails;
import com.desk.ticket.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody TicketCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        TicketResponse response = ticketService.createTicket(request, user);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getTickets(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        
        // If admin, we can default to returning all tickets, but wait: the endpoint guidelines say
        // "GET /api/tickets: List tickets. Users get their own tickets; admins get all tickets."
        // We will implement that logic:
        List<TicketResponse> tickets;
        if (user.getRole() == Role.ROLE_ADMIN) {
            // We will inject Admin management code or call a service method.
            // Let's implement an admin list method in TicketService or handle it here by checking role.
            // Let's check: TicketService can have a method to get all tickets. Let's add it or use a query.
            // Wait, does TicketService have a method to get all tickets? Let's check.
            // Let's add getAllTickets() to TicketService. Let's do that!
            tickets = ticketService.getAllTicketsForAdmin();
        } else {
            tickets = ticketService.getOwnTickets(user);
        }
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        TicketResponse response = ticketService.getTicketById(id, user);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketResponse> updateTicket(
            @PathVariable Long id,
            @Valid @RequestBody TicketUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        TicketResponse response = ticketService.updateTicket(id, request, user);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        ticketService.deleteTicket(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<UserDashboardStats> getUserStats(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        UserDashboardStats stats = ticketService.getUserStats(user);
        return ResponseEntity.ok(stats);
    }
}
