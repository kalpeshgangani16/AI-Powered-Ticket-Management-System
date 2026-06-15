package com.desk.ticket.config;

import com.desk.ticket.entity.Role;
import com.desk.ticket.entity.User;
import com.desk.ticket.entity.Ticket;
import com.desk.ticket.entity.Comment;
import com.desk.ticket.repository.UserRepository;
import com.desk.ticket.repository.TicketRepository;
import com.desk.ticket.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Explicitly remove legacy agent user and clean up any references if present
        userRepository.findByEmail("agent@example.com").ifPresent(agentUser -> {
            log.info("Found legacy support agent user. Cleaning up references...");
            
            // Find or seed the regular Support Engineer user to reassign to
            User engineerUser = userRepository.findByEmail("engineer@example.com")
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .name("Support Engineer")
                                .email("engineer@example.com")
                                .password(passwordEncoder.encode("Password123"))
                                .role(Role.ROLE_SUPPORT_ENGINEER)
                                .build();
                        return userRepository.save(newUser);
                    });

            // Reassign tickets assigned to agentUser to engineerUser
            List<Ticket> tickets = ticketRepository.findAll();
            boolean updatedTickets = false;
            for (Ticket t : tickets) {
                if (t.getAssignedTo() != null && t.getAssignedTo().getId().equals(agentUser.getId())) {
                    t.setAssignedTo(engineerUser);
                    ticketRepository.save(t);
                    updatedTickets = true;
                }
            }
            if (updatedTickets) {
                log.info("Reassigned legacy support agent's tickets to Support Engineer.");
            }

            // Reassign comments written by agentUser to engineerUser
            List<Comment> comments = commentRepository.findAll();
            boolean updatedComments = false;
            for (Comment c : comments) {
                if (c.getUser().getId().equals(agentUser.getId())) {
                    c.setUser(engineerUser);
                    commentRepository.save(c);
                    updatedComments = true;
                }
            }
            if (updatedComments) {
                log.info("Reassigned legacy support agent's comments to Support Engineer.");
            }

            // Delete the legacy Support Agent user
            userRepository.delete(agentUser);
            log.info("Deleted legacy support agent user agent@example.com successfully.");
        });

        if (userRepository.count() == 0) {
            log.info("Database is empty. Seeding initial users...");

            // Seed User
            User standardUser = User.builder()
                    .name("Regular User")
                    .email("user@example.com")
                    .password(passwordEncoder.encode("Password123"))
                    .role(Role.ROLE_USER)
                    .build();
            userRepository.save(standardUser);
            log.info("Seeded regular user: user@example.com / Password123");

            // Seed Support Engineer
            User engineerUser = User.builder()
                    .name("Support Engineer")
                    .email("engineer@example.com")
                    .password(passwordEncoder.encode("Password123"))
                    .role(Role.ROLE_SUPPORT_ENGINEER)
                    .build();
            userRepository.save(engineerUser);
            log.info("Seeded support engineer user: engineer@example.com / Password123");


            // Seed Admin
            User adminUser = User.builder()
                    .name("System Administrator")
                    .email("admin@example.com")
                    .password(passwordEncoder.encode("Password123"))
                    .role(Role.ROLE_ADMIN)
                    .build();
            userRepository.save(adminUser);
            log.info("Seeded admin user: admin@example.com / Password123");
        } else {
            log.info("Database already contains users. Skipping seeder.");
        }
    }
}
