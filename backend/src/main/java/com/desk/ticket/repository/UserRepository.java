package com.desk.ticket.repository;

import com.desk.ticket.entity.User;
import com.desk.ticket.entity.Role;
import com.desk.ticket.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);

    List<User> findByRoleAndDepartment(Role role, Department department);

    List<User> findByRole(Role role);
}
