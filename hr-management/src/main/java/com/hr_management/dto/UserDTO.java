package com.hr_management.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UserDTO {
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
    private String status; // New field
    private String disapproveReason; // New field

    public UserDTO() {}

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
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDisapproveReason() { return disapproveReason; }
    public void setDisapproveReason(String disapproveReason) { this.disapproveReason = disapproveReason; }
}