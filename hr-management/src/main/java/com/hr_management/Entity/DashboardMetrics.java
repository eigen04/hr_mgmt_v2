package com.hr_management.Entity;

public class DashboardMetrics {
    private long totalEmployees;
    private long onLeaveToday;
    private long assistantDirectors;
    private long projectManagers;

    public long getTotalEmployees() { return totalEmployees; }
    public void setTotalEmployees(long totalEmployees) { this.totalEmployees = totalEmployees; }

    public long getOnLeaveToday() { return onLeaveToday; }
    public void setOnLeaveToday(long onLeaveToday) { this.onLeaveToday = onLeaveToday; }

    public long getAssistantDirectors() { return assistantDirectors; }
    public void setAssistantDirectors(long assistantDirectors) { this.assistantDirectors = assistantDirectors; }

    public long getProjectManagers() { return projectManagers; }
    public void setProjectManagers(long projectManagers) { this.projectManagers = projectManagers; }
}