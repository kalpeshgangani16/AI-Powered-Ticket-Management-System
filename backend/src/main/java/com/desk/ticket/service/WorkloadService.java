package com.desk.ticket.service;

import com.desk.ticket.entity.Role;
import com.desk.ticket.entity.Status;
import com.desk.ticket.entity.User;
import com.desk.ticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkloadService {

    private final TicketRepository ticketRepository;

    public double calculateWorkload(User engineer) {
        long openCount = ticketRepository.countByAssignedToIdAndStatus(engineer.getId(), Status.OPEN);
        long inProgressCount = ticketRepository.countByAssignedToIdAndStatus(engineer.getId(), Status.IN_PROGRESS);
        double workload = (openCount * 1.0) + (inProgressCount * 2.0);
        log.debug("Workload calculation for engineer {}: open={} (w=1.0), in_progress={} (w=2.0) -> score={}",
                engineer.getEmail(), openCount, inProgressCount, workload);
        return workload;
    }

    public User findLeastLoadedEngineer(List<User> engineers) {
        if (engineers == null || engineers.isEmpty()) {
            return null;
        }

        User bestEngineer = null;
        double minWorkload = Double.MAX_VALUE;

        for (User engineer : engineers) {
            double currentWorkload = calculateWorkload(engineer);
            if (bestEngineer == null) {
                bestEngineer = engineer;
                minWorkload = currentWorkload;
            } else if (currentWorkload < minWorkload) {
                bestEngineer = engineer;
                minWorkload = currentWorkload;
            } else if (currentWorkload == minWorkload) {
                // Deterministic Tie-Breaker: Earlier Joined (createdAt), then lower ID
                boolean isEarlierJoined = false;
                if (engineer.getCreatedAt() != null && bestEngineer.getCreatedAt() != null) {
                    if (engineer.getCreatedAt().isBefore(bestEngineer.getCreatedAt())) {
                        isEarlierJoined = true;
                    } else if (engineer.getCreatedAt().isEqual(bestEngineer.getCreatedAt())) {
                        if (engineer.getId() < bestEngineer.getId()) {
                            isEarlierJoined = true;
                        }
                    }
                } else {
                    if (engineer.getId() < bestEngineer.getId()) {
                        isEarlierJoined = true;
                    }
                }

                if (isEarlierJoined) {
                    log.debug("Tie-breaker activated: choosing engineer {} over {} due to earlier registration or lower ID",
                            engineer.getEmail(), bestEngineer.getEmail());
                    bestEngineer = engineer;
                }
            }
        }

        return bestEngineer;
    }
}
