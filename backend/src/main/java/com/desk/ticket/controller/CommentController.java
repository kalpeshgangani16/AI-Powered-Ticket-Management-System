package com.desk.ticket.controller;

import com.desk.ticket.dto.CommentRequest;
import com.desk.ticket.dto.CommentResponse;
import com.desk.ticket.entity.User;
import com.desk.ticket.security.CustomUserDetails;
import com.desk.ticket.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long ticketId,
            @RequestBody CommentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        CommentResponse response = commentService.createComment(ticketId, request, user);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{ticketId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        List<CommentResponse> comments = commentService.getCommentsByTicketId(ticketId, user);
        return ResponseEntity.ok(comments);
    }
}
