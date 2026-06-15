package com.desk.ticket.service;

import com.desk.ticket.dto.*;
import com.desk.ticket.entity.Role;
import com.desk.ticket.entity.Status;
import com.desk.ticket.entity.Ticket;
import com.desk.ticket.entity.User;
import com.desk.ticket.entity.Department;
import com.desk.ticket.entity.Comment;
import com.desk.ticket.entity.Attachment;
import com.desk.ticket.exception.ResourceNotFoundException;
import com.desk.ticket.exception.UnauthorizedAccessException;
import com.desk.ticket.repository.TicketRepository;
import com.desk.ticket.repository.UserRepository;
import com.desk.ticket.repository.CommentRepository;
import com.desk.ticket.repository.AttachmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final TicketService ticketService;
    private final PasswordEncoder passwordEncoder;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        log.debug("Fetching all registered users for admin dashboard");
        return userRepository.findAll().stream()
                .map(user -> UserProfileResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .department(user.getDepartment() != null ? user.getDepartment().name() : null)
                        .createdAt(user.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTickets(User user) {
        log.debug("Fetching tickets for user dashboard: {}", user.getEmail());
        if (user.getRole() == Role.ROLE_ADMIN) {
            return ticketService.getAllTicketsForAdmin();
        } else {
            return ticketRepository.findByAssignedToIdOrderByCreatedAtDesc(user.getId())
                    .stream()
                    .map(ticketService::mapToResponse)
                    .collect(Collectors.toList());
        }
    }

    @Transactional
    public TicketResponse assignTicket(TicketAssignRequest request) {
        log.info("Assigning ticket ID: {} to user ID: {}", request.getTicketId(), request.getUserId());
        
        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + request.getTicketId()));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));

        // Validation: Assignee must be Admin or Support Engineer
        if (user.getRole() != Role.ROLE_ADMIN && user.getRole() != Role.ROLE_SUPPORT_ENGINEER) {
            throw new IllegalArgumentException("Tickets can only be assigned to Support Engineers or Administrators");
        }

        ticket.setAssignedTo(user);
        
        // Auto transition status to IN_PROGRESS when assigned if it was OPEN
        if (ticket.getStatus() == Status.OPEN) {
            ticket.setStatus(Status.IN_PROGRESS);
            log.info("Ticket status transitioned to IN_PROGRESS due to assignment");
        }

        Ticket savedTicket = ticketRepository.save(ticket);
        return ticketService.mapToResponse(savedTicket);
    }

    @Transactional
    public TicketResponse updateTicketStatus(TicketStatusUpdateRequest request, User user) {
        log.info("Updating status of ticket ID: {} to {} by {}", request.getTicketId(), request.getStatus(), user.getEmail());
        
        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + request.getTicketId()));

        // Security check: Support engineer can only update tickets assigned to them
        if (user.getRole() == Role.ROLE_SUPPORT_ENGINEER) {
            boolean isAssignedToMe = ticket.getAssignedTo() != null && ticket.getAssignedTo().getId().equals(user.getId());
            if (!isAssignedToMe) {
                throw new UnauthorizedAccessException("You can only update status of tickets assigned to you");
            }
        }

        try {
            Status newStatus = Status.valueOf(request.getStatus().toUpperCase());
            ticket.setStatus(newStatus);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid ticket status: " + request.getStatus());
        }

        Ticket savedTicket = ticketRepository.save(ticket);
        return ticketService.mapToResponse(savedTicket);
    }

    @Transactional(readOnly = true)
    public AdminDashboardStats getAdminStats(User user) {
        log.debug("Fetching statistics for user dashboard: {}", user.getEmail());
        
        if (user.getRole() == Role.ROLE_ADMIN) {
            long totalUsers = userRepository.count();
            long totalTickets = ticketRepository.count();
            long openTickets = ticketRepository.countByStatus(Status.OPEN);
            long inProgressTickets = ticketRepository.countByStatus(Status.IN_PROGRESS);
            long resolvedTickets = ticketRepository.countByStatus(Status.RESOLVED);

            return AdminDashboardStats.builder()
                    .totalUsers(totalUsers)
                    .totalTickets(totalTickets)
                    .openTickets(openTickets)
                    .inProgressTickets(inProgressTickets)
                    .resolvedTickets(resolvedTickets)
                    .build();
        } else {
            long totalTickets = ticketRepository.countByAssignedToId(user.getId());
            long openTickets = ticketRepository.countByAssignedToIdAndStatus(user.getId(), Status.OPEN);
            long inProgressTickets = ticketRepository.countByAssignedToIdAndStatus(user.getId(), Status.IN_PROGRESS);
            long resolvedTickets = ticketRepository.countByAssignedToIdAndStatus(user.getId(), Status.RESOLVED);

            return AdminDashboardStats.builder()
                    .totalUsers(0)
                    .totalTickets(totalTickets)
                    .openTickets(openTickets)
                    .inProgressTickets(inProgressTickets)
                    .resolvedTickets(resolvedTickets)
                    .build();
        }
    }

    @Transactional
    public UserProfileResponse createUser(UserCreateRequest request) {
        log.info("Admin creating new user: {} with role: {}", request.getEmail(), request.getRole());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }

        Role userRole;
        try {
            userRole = Role.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid user role: " + request.getRole());
        }

        Department userDepartment = null;
        if (request.getDepartment() != null && !request.getDepartment().trim().isEmpty()) {
            try {
                userDepartment = Department.valueOf(request.getDepartment().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid department: " + request.getDepartment());
            }
        } else if (userRole == Role.ROLE_SUPPORT_ENGINEER || userRole == Role.ROLE_ADMIN) {
            userDepartment = Department.IT_SUPPORT;
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .department(userDepartment)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User created successfully by admin with ID: {}", savedUser.getId());

        return UserProfileResponse.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .department(savedUser.getDepartment() != null ? savedUser.getDepartment().name() : null)
                .createdAt(savedUser.getCreatedAt())
                .build();
    }

    @Transactional
    public void deleteUser(Long userId) {
        log.info("Deleting user ID: {} from system", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // 1. Nullify assignedTo on all tickets assigned to this user
        List<Ticket> assignedTickets = ticketRepository.findByAssignedToIdOrderByCreatedAtDesc(userId);
        for (Ticket ticket : assignedTickets) {
            ticket.setAssignedTo(null);
            ticketRepository.save(ticket);
        }

        // 2. Delete all comments made by this user
        List<Comment> userComments = commentRepository.findByUserId(userId);
        commentRepository.deleteAll(userComments);

        // 3. For all tickets created by this user, delete their attachments, comments, and then the tickets
        List<Ticket> createdTickets = ticketRepository.findByCreatedByIdOrderByCreatedAtDesc(userId);
        for (Ticket ticket : createdTickets) {
            List<Attachment> attachments = attachmentRepository.findByTicketId(ticket.getId());
            attachmentRepository.deleteAll(attachments);

            List<Comment> ticketComments = commentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());
            commentRepository.deleteAll(ticketComments);

            ticketRepository.delete(ticket);
        }

        // 4. Delete the user entity
        userRepository.delete(user);
        log.info("User ID: {} successfully deleted", userId);
    }
}
