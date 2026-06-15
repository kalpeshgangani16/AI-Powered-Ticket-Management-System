package com.desk.ticket.controller;

import com.desk.ticket.dto.AttachmentResponse;
import com.desk.ticket.entity.Attachment;
import com.desk.ticket.entity.User;
import com.desk.ticket.security.CustomUserDetails;
import com.desk.ticket.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping("/tickets/{ticketId}/attachments")
    public ResponseEntity<AttachmentResponse> uploadAttachment(
            @PathVariable Long ticketId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails userDetails) throws IOException {
        User user = userDetails.getUser();
        AttachmentResponse response = attachmentService.uploadAttachment(ticketId, file, user);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/attachments/{id}")
    public ResponseEntity<byte[]> downloadAttachment(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        Attachment attachment = attachmentService.getAttachment(id, user);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(attachment.getFileData());
    }
}
