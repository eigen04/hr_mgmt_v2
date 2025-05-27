package com.hr_management.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String role;

    @Column
    private String gender;

    @Embedded
    private LeaveBalance leaveBalance = new LeaveBalance(); // initialize with default values

    @Column(nullable = false)
    private String status = "ACTIVE"; // Add this field

    @Column(name = "leave_without_payment", nullable = false)
    private Double leaveWithoutPayment = 0.0; // Maps to the new column

    @Column(name = "half_day_lwp", nullable = false)
    private Double halfDayLwp = 0.0; // Maps to the new column

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public LeaveBalance getLeaveBalance() {
        return leaveBalance;
    }

    public void setLeaveBalance(LeaveBalance leaveBalance) {
        this.leaveBalance = leaveBalance;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getLeaveWithoutPayment() {
        return leaveWithoutPayment;
    }

    public void setLeaveWithoutPayment(Double leaveWithoutPayment) {
        this.leaveWithoutPayment = leaveWithoutPayment;
    }

    public Double getHalfDayLwp() {
        return halfDayLwp;
    }

    public void setHalfDayLwp(Double halfDayLwp) {
        this.halfDayLwp = halfDayLwp;
    }
}