package com.desk.ticket.service;

import com.desk.ticket.dto.CommentRequest;
import com.desk.ticket.dto.CommentResponse;
import com.desk.ticket.dto.UserSummaryDto;
import com.desk.ticket.entity.Comment;
import com.desk.ticket.entity.Role;
import com.desk.ticket.entity.Ticket;
import com.desk.ticket.entity.User;
import com.desk.ticket.exception.ResourceNotFoundException;
import com.desk.ticket.exception.UnauthorizedAccessException;
import com.desk.ticket.repository.CommentRepository;
import com.desk.ticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;

    @Transactional
    public CommentResponse createComment(Long ticketId, CommentRequest request, User user) {
        log.info("Adding comment to ticket: {} by user: {}", ticketId, user.getEmail());
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + ticketId));

        // Security check: Only creator, admin, or support engineer can comment
        if (user.getRole() != Role.ROLE_ADMIN && user.getRole() != Role.ROLE_SUPPORT_ENGINEER && !ticket.getCreatedBy().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You are not authorized to comment on this ticket");
        }

        Comment comment = Comment.builder()
                .ticket(ticket)
                .user(user)
                .text(request.getText())
                .build();

        Comment savedComment = commentRepository.save(comment);
        log.info("Comment created successfully with ID: {}", savedComment.getId());
        return mapToResponse(savedComment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByTicketId(Long ticketId, User user) {
        log.debug("Fetching comments for ticket: {} by user: {}", ticketId, user.getEmail());
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + ticketId));

        // Security check
        if (user.getRole() != Role.ROLE_ADMIN && user.getRole() != Role.ROLE_SUPPORT_ENGINEER && !ticket.getCreatedBy().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You are not authorized to view comments for this ticket");
        }

        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse mapToResponse(Comment comment) {
        UserSummaryDto userSummary = UserSummaryDto.builder()
                .id(comment.getUser().getId())
                .name(comment.getUser().getName())
                .email(comment.getUser().getEmail())
                .build();

        return CommentResponse.builder()
                .id(comment.getId())
                .ticketId(comment.getTicket().getId())
                .user(userSummary)
                .text(comment.getText())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
