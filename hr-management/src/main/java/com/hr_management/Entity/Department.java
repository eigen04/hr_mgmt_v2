package com.hr_management.Entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("id")
    private Long id;

    @Column(nullable = false)
    @JsonProperty("name")
    private String name;

    @JsonProperty("description")
    private String description;

    @Transient
    @JsonProperty("employeeCount")
    private int employeeCount;

    @Transient
    @JsonProperty("onLeaveCount")
    private int onLeaveCount;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getEmployeeCount() {
        return employeeCount;
    }

    public void setEmployeeCount(int employeeCount) {
        this.employeeCount = employeeCount;
    }

    public int getOnLeaveCount() {
        return onLeaveCount;
    }

    public void setOnLeaveCount(int onLeaveCount) {
        this.onLeaveCount = onLeaveCount;
    }
}