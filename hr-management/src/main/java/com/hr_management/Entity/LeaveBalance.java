package com.hr_management.Entity;

import jakarta.persistence.*;
import java.util.HashMap;
import java.util.Map;

@Embeddable
public class LeaveBalance {
    private double casualLeaveUsed = 0.0;
    private double casualLeaveRemaining = 0.0;

    @ElementCollection
    @CollectionTable(
            name = "monthly_cl_accrual",
            joinColumns = @JoinColumn(name = "user_id")
    )
    @MapKeyColumn(name = "month")
    @Column(name = "accrual")
    private Map<Integer, Double> monthlyClAccrual = new HashMap<>();

    private double earnedLeaveUsedFirstHalf = 0.0;
    private double earnedLeaveUsedSecondHalf = 0.0;
    private double earnedLeaveRemaining = 0.0;
    private double maternityLeaveUsed = 0.0;
    private double maternityLeaveRemaining = 182.0;
    private double paternityLeaveUsed = 0.0;
    private double paternityLeaveRemaining = 15.0;

    private Integer lastInitializedYear; // Add this field

    // Getters and Setters
    public double getCasualLeaveUsed() { return casualLeaveUsed; }
    public void setCasualLeaveUsed(double casualLeaveUsed) { this.casualLeaveUsed = casualLeaveUsed; }
    public double getCasualLeaveRemaining() { return casualLeaveRemaining; }
    public void setCasualLeaveRemaining(double casualLeaveRemaining) { this.casualLeaveRemaining = casualLeaveRemaining; }
    public Map<Integer, Double> getMonthlyClAccrual() { return monthlyClAccrual; }
    public void setMonthlyClAccrual(Map<Integer, Double> monthlyClAccrual) { this.monthlyClAccrual = monthlyClAccrual; }
    public double getEarnedLeaveUsedFirstHalf() { return earnedLeaveUsedFirstHalf; }
    public void setEarnedLeaveUsedFirstHalf(double earnedLeaveUsedFirstHalf) { this.earnedLeaveUsedFirstHalf = earnedLeaveUsedFirstHalf; }
    public double getEarnedLeaveUsedSecondHalf() { return earnedLeaveUsedSecondHalf; }
    public void setEarnedLeaveUsedSecondHalf(double earnedLeaveUsedSecondHalf) { this.earnedLeaveUsedSecondHalf = earnedLeaveUsedSecondHalf; }
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

    // Add getter and setter for lastInitializedYear
    public Integer getLastInitializedYear() { return lastInitializedYear; }
    public void setLastInitializedYear(Integer lastInitializedYear) { this.lastInitializedYear = lastInitializedYear; }
}