package com.desk.ticket.service;

import com.desk.ticket.dto.AttachmentResponse;
import com.desk.ticket.entity.Attachment;
import com.desk.ticket.entity.Role;
import com.desk.ticket.entity.Ticket;
import com.desk.ticket.entity.User;
import com.desk.ticket.exception.ResourceNotFoundException;
import com.desk.ticket.exception.UnauthorizedAccessException;
import com.desk.ticket.repository.AttachmentRepository;
import com.desk.ticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TicketRepository ticketRepository;

    @Transactional
    public AttachmentResponse uploadAttachment(Long ticketId, MultipartFile file, User user) throws IOException {
        log.info("Uploading file attachment for ticket: {} by user: {}", ticketId, user.getEmail());
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + ticketId));

        // Security check: Only creator, admin, or support engineer can upload
        if (user.getRole() != Role.ROLE_ADMIN && user.getRole() != Role.ROLE_SUPPORT_ENGINEER && !ticket.getCreatedBy().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You are not authorized to upload attachments for this ticket");
        }

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }

        // Limit size to 10MB
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 10MB");
        }

        String fileName = file.getOriginalFilename();
        if (fileName != null) {
            fileName = org.springframework.util.StringUtils.cleanPath(fileName);
        } else {
            fileName = "unnamed_file";
        }

        Attachment attachment = Attachment.builder()
                .ticket(ticket)
                .fileName(fileName)
                .fileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .fileData(file.getBytes())
                .build();

        Attachment savedAttachment = attachmentRepository.save(attachment);
        log.info("Attachment uploaded successfully with ID: {}", savedAttachment.getId());

        return AttachmentResponse.builder()
                .id(savedAttachment.getId())
                .ticketId(ticket.getId())
                .fileName(savedAttachment.getFileName())
                .fileType(savedAttachment.getFileType())
                .createdAt(savedAttachment.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public Attachment getAttachment(Long id, User user) {
        log.debug("Fetching attachment by ID: {} for user: {}", id, user.getEmail());
        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with ID: " + id));

        Ticket ticket = attachment.getTicket();
        // Security check: Only creator, admin, or support engineer can download
        if (user.getRole() != Role.ROLE_ADMIN && user.getRole() != Role.ROLE_SUPPORT_ENGINEER && !ticket.getCreatedBy().getId().equals(user.getId())) {
            throw new UnauthorizedAccessException("You are not authorized to access this attachment");
        }

        return attachment;
    }
}
