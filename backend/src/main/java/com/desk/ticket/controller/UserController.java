package com.desk.ticket.controller;

import com.desk.ticket.dto.UserProfileResponse;
import com.desk.ticket.entity.User;
import com.desk.ticket.security.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getUserProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userDetails.getUser();
        UserProfileResponse profileResponse = UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .build();
        return ResponseEntity.ok(profileResponse);
    }
}
