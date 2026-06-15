package com.desk.ticket.service;

import com.desk.ticket.dto.AuthResponse;
import com.desk.ticket.dto.LoginRequest;
import com.desk.ticket.dto.RegisterRequest;
import com.desk.ticket.entity.Role;
import com.desk.ticket.entity.User;
import com.desk.ticket.exception.EmailAlreadyExistsException;
import com.desk.ticket.repository.UserRepository;
import com.desk.ticket.security.CustomUserDetails;
import com.desk.ticket.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public Long registerUser(RegisterRequest registerRequest) {
        log.debug("Registering new user with email: {}", registerRequest.getEmail());
        
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            log.warn("Email registration failed - already exists: {}", registerRequest.getEmail());
            throw new EmailAlreadyExistsException("Email is already in use");
        }

        User user = User.builder()
                .name(registerRequest.getName())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(Role.ROLE_USER) // default role for self-registration
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());
        return savedUser.getId();
    }

    public AuthResponse loginUser(LoginRequest loginRequest) {
        log.debug("Authenticating user with email: {}", loginRequest.getEmail());
        
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        String jwt = tokenProvider.generateToken(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        log.info("User authenticated successfully: {}", loginRequest.getEmail());
        return AuthResponse.builder()
                .token(jwt)
                .name(userDetails.getUser().getName())
                .email(userDetails.getUser().getEmail())
                .role(userDetails.getUser().getRole().name())
                .build();
    }
}
