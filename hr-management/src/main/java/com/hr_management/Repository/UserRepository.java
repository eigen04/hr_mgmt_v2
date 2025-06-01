package com.hr_management.Repository;

import com.hr_management.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    // New method to find users by role name (for reporting persons)
    List<User> findByRoleIgnoreCase(String role);
    List<User> findByRoleIgnoreCaseAndStatus(String role, String status);
    List<User> findByRoleIgnoreCaseAndDepartmentAndStatus(String role, String department, String status);

    // New method to find users by department and reportingTo ID
    @Query("SELECT u FROM User u WHERE u.department = :department AND u.reportingTo.id = :reportingToId")
    List<User> findByDepartmentAndReportingToId(@Param("department") String department, @Param("reportingToId") Long reportingToId);
}