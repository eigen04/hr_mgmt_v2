package com.hr_management.Entity;

import jakarta.persistence.Embeddable;

@Embeddable
public class LeaveBalance {
    private double casualLeaveUsed = 0.0;
    private double casualLeaveRemaining = 12.0;
    private double earnedLeaveUsed = 0.0;
    private double earnedLeaveRemaining = 20.0;
    private double maternityLeaveUsed = 0.0;
    private double maternityLeaveRemaining = 182.0;
    private double paternityLeaveUsed = 0.0;
    private double paternityLeaveRemaining = 15.0;

    // Getters and Setters
    public double getCasualLeaveUsed() { return casualLeaveUsed; }
    public void setCasualLeaveUsed(double casualLeaveUsed) { this.casualLeaveUsed = casualLeaveUsed; }
    public double getCasualLeaveRemaining() { return casualLeaveRemaining; }
    public void setCasualLeaveRemaining(double casualLeaveRemaining) { this.casualLeaveRemaining = casualLeaveRemaining; }
    public double getEarnedLeaveUsed() { return earnedLeaveUsed; }
    public void setEarnedLeaveUsed(double earnedLeaveUsed) { this.earnedLeaveUsed = earnedLeaveUsed; }
    public double getEarnedLeaveRemaining() { return earnedLeaveRemaining; }
    public void setEarnedLeaveRemaining(double earnedLeaveRemaining) { this.earnedLeaveRemaining = earnedLeaveRemaining; }
    public double getMaternityLeaveUsed() { return maternityLeaveUsed; }
    public void setMaternityLeaveUsed(double maternityLeaveUsed) { this.maternityLeaveUsed = maternityLeaveUsed; }
    public double getMaternityLeaveRemaining() { return maternityLeaveRemaining; }
    public void setMaternityLeaveRemaining(double maternityLeaveRemaining) { this.maternityLeaveRemaining = maternityLeaveRemaining; }
    public double getPaternityLeaveUsed() { return paternityLeaveUsed; }
    public void setPaternityLeaveUsed(double paternityLeaveUsed) { this.paternityLeaveUsed = paternityLeaveUsed; }
    public double getPaternityLeaveRemaining() { return paternityLeaveRemaining; }
    public void setPaternityLeaveRemaining(double paternityLeaveRemaining) { this.paternityLeaveRemaining = paternityLeaveRemaining; }
}