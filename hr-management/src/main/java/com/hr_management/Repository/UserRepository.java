package com.hr_management.Repository;

import com.hr_management.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    List<User> findByDepartment(String department);

    long countByDepartment(String department);

    long countByRole(String role);

    // New method to find users by department and role
    Optional<User> findByDepartmentAndRole(String department, String role);

    // New method to find users by role
    List<User> findByRole(String role);

    // Methods to check if username or email exists
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    // Add method to find user by email
    Optional<User> findByEmail(String email);
}