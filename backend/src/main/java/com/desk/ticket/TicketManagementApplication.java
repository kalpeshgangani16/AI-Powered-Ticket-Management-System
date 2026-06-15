package com.desk.ticket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class TicketManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(TicketManagementApplication.class, args);
    }
}
