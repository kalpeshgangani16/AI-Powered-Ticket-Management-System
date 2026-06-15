package com.desk.ticket.controller;

import com.desk.ticket.dto.*;
import com.desk.ticket.entity.User;
import com.desk.ticket.security.CustomUserDetails;
import com.desk.ticket.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserProfileResponse>> getAllUsers() {
        List<UserProfileResponse> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/tickets")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_ENGINEER')")
    public ResponseEntity<List<TicketResponse>> getAllTickets(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        List<TicketResponse> tickets = adminService.getAllTickets(user);
        return ResponseEntity.ok(tickets);
    }

    @PutMapping("/assign-ticket")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_ENGINEER')")
    public ResponseEntity<TicketResponse> assignTicket(@Valid @RequestBody TicketAssignRequest request) {
        TicketResponse response = adminService.assignTicket(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/update-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_ENGINEER')")
    public ResponseEntity<TicketResponse> updateTicketStatus(
            @Valid @RequestBody TicketStatusUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        TicketResponse response = adminService.updateTicketStatus(request, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_ENGINEER')")
    public ResponseEntity<AdminDashboardStats> getAdminStats(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        AdminDashboardStats stats = adminService.getAdminStats(user);
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserProfileResponse> createUser(@Valid @RequestBody UserCreateRequest request) {
        UserProfileResponse response = adminService.createUser(request);
        return new ResponseEntity<>(response, org.springframework.http.HttpStatus.CREATED);
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
