package com.desk.ticket.repository;

import com.desk.ticket.entity.Status;
import com.desk.ticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByCreatedByIdOrderByCreatedAtDesc(Long userId);

    List<Ticket> findByAssignedToIdOrderByCreatedAtDesc(Long userId);

    List<Ticket> findAllByOrderByCreatedAtDesc();

    long countByCreatedById(Long userId);

    long countByCreatedByIdAndStatus(Long userId, Status status);

    long countByAssignedToId(Long userId);

    long countByAssignedToIdAndStatus(Long userId, Status status);

    long countByStatus(Status status);
}
