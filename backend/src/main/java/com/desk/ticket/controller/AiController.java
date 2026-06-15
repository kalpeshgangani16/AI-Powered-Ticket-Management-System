package com.desk.ticket.controller;

import com.desk.ticket.dto.AiClassifyRequest;
import com.desk.ticket.dto.GeminiTriageResult;
import com.desk.ticket.service.GeminiClassifierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final GeminiClassifierService geminiClassifierService;

    @PostMapping("/classify")
    public ResponseEntity<GeminiTriageResult> classifyTicket(@Valid @RequestBody AiClassifyRequest request) {
        GeminiTriageResult classification = geminiClassifierService.triageDescription(request.getDescription());
        return ResponseEntity.ok(classification);
    }
}
