package com.hr_management.Controller;

import com.hr_management.Entity.Department;
import com.hr_management.Entity.User;
import com.hr_management.service.DepartmentService;
import com.hr_management.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private DepartmentService departmentService;

    @GetMapping("/users/me")
    public ResponseEntity<User> getCurrentUser() {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(user);
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getAllDepartments() {
        List<Department> departments = departmentService.getAllDepartments();
        return ResponseEntity.ok(departments);
    }

    @GetMapping("/departments/{id}")
    public ResponseEntity<Department> getDepartmentById(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User currentUser = userService.getCurrentUser();
        String userRole = currentUser.getRole();
        String userDepartment = currentUser.getDepartment();

        Optional<Department> departmentOpt = departmentService.getDepartmentById(id);
        if (departmentOpt.isEmpty()) {
            return ResponseEntity.status(404).body(null);
        }
        Department department = departmentOpt.get();

        if (userRole.equals("ASSISTANT_DIRECTOR")) {
            if (!department.getName().equals(userDepartment)) {
                return ResponseEntity.status(403).body(null);
            }
        }

        return ResponseEntity.ok(department);
    }

    class UserDTO {
        private Long id;
        private String fullName;
        private String department;
        private String email;
        private String status;
        private String disapproveReason;
        private String role;
        private String gender;
        private String reportingToName;
        private LocalDate joinDate;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getDisapproveReason() { return disapproveReason; }
        public void setDisapproveReason(String disapproveReason) { this.disapproveReason = disapproveReason; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }
        public String getReportingToName() { return reportingToName; }
        public void setReportingToName(String reportingToName) { this.reportingToName = reportingToName; }
        public LocalDate getJoinDate() { return joinDate; }
        public void setJoinDate(LocalDate joinDate) { this.joinDate = joinDate; }
    }

    @GetMapping("/users/hods")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<List<UserDTO>> getHods() {
        try {
            List<User> hods = userService.getHods();
            List<UserDTO> hodDTOs = hods.stream().map(user -> {
                UserDTO dto = new UserDTO();
                dto.setId(user.getId());
                dto.setFullName(user.getFullName());
                dto.setDepartment(user.getDepartment());
                dto.setEmail(user.getEmail());
                dto.setStatus(user.getStatus());
                dto.setDisapproveReason(user.getDisapproveReason());
                dto.setRole(user.getRole());
                dto.setGender(user.getGender());
                dto.setReportingToName(user.getReportingTo() != null ? user.getReportingTo().getFullName() : null);
                dto.setJoinDate(user.getJoinDate());
                return dto;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(hodDTOs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    @PatchMapping("/users/{id}/status")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> statusUpdate) {
        try {
            String newStatus = statusUpdate.get("status");
            userService.updateUserStatus(id, newStatus);
            return ResponseEntity.ok(Collections.singletonMap("message", "User status updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.singletonMap("message", "An error occurred: " + e.getMessage()));
        }
    }

    @GetMapping("/users/subordinates")
    public ResponseEntity<List<User>> getSubordinates() {
        User currentUser = userService.getCurrentUser();
        List<User> subordinates = currentUser.getSubordinates();
        return ResponseEntity.ok(subordinates);
    }

    @GetMapping("/hr/pending-signups")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<UserDTO>> getPendingSignups() {
        try {
            List<User> pendingUsers = userService.getPendingUsers();
            List<UserDTO> userDTOs = pendingUsers.stream().map(user -> {
                UserDTO dto = new UserDTO();
                dto.setId(user.getId());
                dto.setFullName(user.getFullName());
                dto.setDepartment(user.getDepartment());
                dto.setEmail(user.getEmail());
                dto.setStatus(user.getStatus());
                dto.setDisapproveReason(user.getDisapproveReason());
                dto.setRole(user.getRole());
                dto.setGender(user.getGender());
                dto.setReportingToName(user.getReportingTo() != null ? user.getReportingTo().getFullName() : null);
                dto.setJoinDate(user.getJoinDate());
                return dto;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(userDTOs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    @PostMapping("/hr/approve-signup/{userId}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<?> approveSignup(@PathVariable Long userId) {
        try {
            userService.approveUser(userId);
            return ResponseEntity.ok(new AuthController.SuccessResponse("User approved successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new AuthController.ErrorResponse("An error occurred: " + e.getMessage()));
        }
    }

    @PostMapping("/hr/disapprove-signup/{userId}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<?> disapproveSignup(@PathVariable Long userId, @RequestBody Map<String, String> request) {
        String reason = request.get("reason");
        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse("Reason for disapproval is required"));
        }
        try {
            userService.rejectUser(userId, reason);
            return ResponseEntity.ok(new AuthController.SuccessResponse("User disapproved successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new AuthController.ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new AuthController.ErrorResponse("An error occurred: " + e.getMessage()));
        }
    }
}