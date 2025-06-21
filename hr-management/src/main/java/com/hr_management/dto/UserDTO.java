package com.hr_management.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class UserDTO {
    private Long id; // Add id field
    @NotBlank
    private String fullName;
    @NotBlank
    private String username;
    @NotBlank
    private String password;
    @NotBlank
    @Email
    private String email;
    private String department; // Allow null for Directors
    @NotBlank
    private String role;
    @NotBlank
    private String gender;
    private Long reportingToId;
    private String reportingToName; // Add reportingToName field
    private String status;
    private String disapproveReason;
    @NotNull(message = "Join date is required")
    private LocalDate joinDate;
    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    public UserDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; } // Add this method

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public Long getReportingToId() { return reportingToId; }
    public void setReportingToId(Long reportingToId) { this.reportingToId = reportingToId; }
    public String getReportingToName() { return reportingToName; }
    public void setReportingToName(String reportingToName) { this.reportingToName = reportingToName; } // Add this method
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDisapproveReason() { return disapproveReason; }
    public void setDisapproveReason(String disapproveReason) { this.disapproveReason = disapproveReason; }
    public LocalDate getJoinDate() { return joinDate; }
    public void setJoinDate(LocalDate joinDate) { this.joinDate = joinDate; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
}

class LoginResponse {
    private String token;
    private String role;

    public LoginResponse() {}
    public LoginResponse(String token, String role) {
        this.token = token;
        this.role = role;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}

class ForgotPasswordRequest {
    @NotBlank
    @Email
    private String email;

    public ForgotPasswordRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}

class ResetPasswordRequest {
    @NotBlank
    private String token;
    @NotBlank
    private String password;
    @NotBlank
    private String confirmPassword;

    public ResetPasswordRequest() {}

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getConfirmPassword() { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
}

class ErrorResponse {
    private String message;

    public ErrorResponse() {}
    public ErrorResponse(String message) { this.message = message; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

class SuccessResponse {
    private String message;

    public SuccessResponse() {}
    public SuccessResponse(String message) { this.message = message; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}