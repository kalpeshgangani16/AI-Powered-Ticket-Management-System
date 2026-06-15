package com.desk.ticket.service;

import com.desk.ticket.dto.*;
import com.desk.ticket.entity.*;
import com.desk.ticket.exception.ResourceNotFoundException;
import com.desk.ticket.exception.UnauthorizedAccessException;
import com.desk.ticket.repository.TicketRepository;
import com.desk.ticket.repository.AttachmentRepository;
import com.desk.ticket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final GeminiClassifierService geminiClassifierService;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final WorkloadService workloadService;

    @Transactional
    public TicketResponse createTicket(TicketCreateRequest request, User creator) {
        log.info("Creating ticket: '{}' for user: {}", request.getTitle(), creator.getEmail());

        GeminiTriageResult triage = geminiClassifierService.triageDescription(request.getDescription());
        Category predictedCategory = Category.valueOf(triage.getCategory());
        Department predictedDepartment = Department.valueOf(triage.getDepartment());
        Priority predictedPriority = Priority.valueOf(triage.getPriority());

        // Weighted Workload balanced routing
        User assignedTo = autoAssignEngineer(predictedDepartment);
        double workloadScore = assignedTo != null ? workloadService.calculateWorkload(assignedTo) : 0.0;

        // Traceability logging for AI decisions
        log.info("[AI TRIAGE REPORT] Title: '{}' | Category: {} | Department: {} | Priority: {} | Assigned Engineer: {} (Workload Score: {})",
                request.getTitle(), predictedCategory, predictedDepartment, predictedPriority,
                assignedTo != null ? assignedTo.getEmail() : "UNASSIGNED", workloadScore);

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(predictedCategory)
                .department(predictedDepartment)
                .priority(predictedPriority)
                .status(assignedTo != null ? Status.IN_PROGRESS : Status.OPEN)
                .engineerSkill(triage.getEngineerSkill())
                .rootCause(triage.getRootCause())
                .assignmentHint(triage.getAssignmentHint())
                .aiResolution(triage.getAiResolution())
                .createdBy(creator)
                .assignedTo(assignedTo)
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);
        log.info("Ticket created successfully with ID: {}", savedTicket.getId());
        return mapToResponse(savedTicket);
    }

    private User autoAssignEngineer(Department department) {
        // Step 1: Same department least load
        List<User> engineers = userRepository.findByRoleAndDepartment(Role.ROLE_SUPPORT_ENGINEER, department);
        
        // Step 2: Global fallback (any support engineer with least load)
        if (engineers.isEmpty()) {
            engineers = userRepository.findByRole(Role.ROLE_SUPPORT_ENGINEER);
        }

        // Step 3: Choose least loaded using WorkloadService (which handles deterministic tie-breaking)
        return workloadService.findLeastLoadedEngineer(engineers);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getOwnTickets(User user) {
        log.debug("Fetching tickets for user: {}", user.getEmail());
        return ticketRepository.findByCreatedByIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTicketsForAdmin() {
        log.debug("Fetching all tickets for admin");
        return ticketRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id, User user) {
        log.debug("Fetching ticket by ID: {} for user: {}", id, user.getEmail());
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + id));

        // Security check
        if (user.getRole() == Role.ROLE_USER) {
            if (!ticket.getCreatedBy().getId().equals(user.getId())) {
                throw new UnauthorizedAccessException("You are not authorized to view this ticket");
            }
        } else if (user.getRole() == Role.ROLE_SUPPORT_ENGINEER) {
            boolean isCreatedByMe = ticket.getCreatedBy().getId().equals(user.getId());
            boolean isAssignedToMe = ticket.getAssignedTo() != null && ticket.getAssignedTo().getId().equals(user.getId());
            if (!isCreatedByMe && !isAssignedToMe) {
                throw new UnauthorizedAccessException("You are not authorized to view this ticket");
            }
        }

        return mapToResponse(ticket);
    }

    @Transactional
    public TicketResponse updateTicket(Long id, TicketUpdateRequest request, User user) {
        log.info("Updating ticket: {} for user: {}", id, user.getEmail());
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + id));

        // Enforce ownership
        if (!ticket.getCreatedBy().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You are not the owner of this ticket");
        }

        // Enforce status constraint: Only OPEN tickets can be modified
        if (ticket.getStatus() != Status.OPEN) {
            throw new IllegalArgumentException("Only tickets with OPEN status can be updated");
        }

        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());

        // Reclassify since description changed
        GeminiTriageResult triage = geminiClassifierService.triageDescription(request.getDescription());
        Category predictedCategory = Category.valueOf(triage.getCategory());
        Department predictedDepartment = Department.valueOf(triage.getDepartment());
        Priority predictedPriority = Priority.valueOf(triage.getPriority());

        // Reassign based on updated department workload
        User assignedTo = autoAssignEngineer(predictedDepartment);
        double workloadScore = assignedTo != null ? workloadService.calculateWorkload(assignedTo) : 0.0;

        log.info("[AI TRIAGE REPORT UPDATE] Ticket ID: {} | Category: {} | Department: {} | Priority: {} | Assigned Engineer: {} (Workload Score: {})",
                id, predictedCategory, predictedDepartment, predictedPriority,
                assignedTo != null ? assignedTo.getEmail() : "UNASSIGNED", workloadScore);

        ticket.setCategory(predictedCategory);
        ticket.setDepartment(predictedDepartment);
        ticket.setPriority(predictedPriority);
        ticket.setEngineerSkill(triage.getEngineerSkill());
        ticket.setRootCause(triage.getRootCause());
        ticket.setAssignmentHint(triage.getAssignmentHint());
        ticket.setAiResolution(triage.getAiResolution());
        ticket.setAssignedTo(assignedTo);
        if (assignedTo != null) {
            ticket.setStatus(Status.IN_PROGRESS);
        }

        Ticket updatedTicket = ticketRepository.save(ticket);
        log.info("Ticket {} updated successfully", id);
        return mapToResponse(updatedTicket);
    }

    @Transactional
    public void deleteTicket(Long id, User user) {
        log.info("Deleting ticket: {} requested by user: {}", id, user.getEmail());
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + id));

        // Enforce ownership
        if (!ticket.getCreatedBy().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You are not the owner of this ticket");
        }

        // Enforce status constraint: Only OPEN tickets can be deleted
        if (ticket.getStatus() != Status.OPEN) {
            throw new IllegalArgumentException("Only tickets with OPEN status can be deleted");
        }

        ticketRepository.delete(ticket);
        log.info("Ticket deleted successfully: {}", id);
    }

    @Transactional(readOnly = true)
    public UserDashboardStats getUserStats(User user) {
        long total = ticketRepository.countByCreatedById(user.getId());
        long open = ticketRepository.countByCreatedByIdAndStatus(user.getId(), Status.OPEN);
        long inProgress = ticketRepository.countByCreatedByIdAndStatus(user.getId(), Status.IN_PROGRESS);
        long resolved = ticketRepository.countByCreatedByIdAndStatus(user.getId(), Status.RESOLVED);

        return UserDashboardStats.builder()
                .totalTickets(total)
                .openTickets(open)
                .inProgressTickets(inProgress)
                .resolvedTickets(resolved)
                .build();
    }

    public TicketResponse mapToResponse(Ticket ticket) {
        UserSummaryDto creator = UserSummaryDto.builder()
                .id(ticket.getCreatedBy().getId())
                .name(ticket.getCreatedBy().getName())
                .email(ticket.getCreatedBy().getEmail())
                .build();

        UserSummaryDto assignee = null;
        if (ticket.getAssignedTo() != null) {
            assignee = UserSummaryDto.builder()
                    .id(ticket.getAssignedTo().getId())
                    .name(ticket.getAssignedTo().getName())
                    .email(ticket.getAssignedTo().getEmail())
                    .build();
        }

        java.util.List<AttachmentResponse> attachments = attachmentRepository.findMetadataByTicketId(ticket.getId());

        // Extract resolutions under transactional session to prevent lazy-init failure
        java.util.List<String> aiResolution = null;
        if (ticket.getAiResolution() != null) {
            aiResolution = new java.util.ArrayList<>(ticket.getAiResolution());
        }

        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .category(ticket.getCategory().name())
                .priority(ticket.getPriority().name())
                .status(ticket.getStatus().name())
                .department(ticket.getDepartment() != null ? ticket.getDepartment().name() : null)
                .engineerSkill(ticket.getEngineerSkill())
                .rootCause(ticket.getRootCause())
                .assignmentHint(ticket.getAssignmentHint())
                .aiResolution(aiResolution)
                .createdBy(creator)
                .assignedTo(assignee)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .attachments(attachments)
                .build();
    }
}
