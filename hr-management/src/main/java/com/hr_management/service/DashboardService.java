package com.hr_management.service;

import com.hr_management.Entity.*;
import com.hr_management.Repository.LeaveApplicationRepository;
import com.hr_management.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class DashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeaveApplicationRepository leaveApplicationRepository;

    public DashboardMetrics getDashboardMetrics() {
        DashboardMetrics metrics = new DashboardMetrics();

        // Total Employees (excluding HR and Director roles)
        long totalEmployees = userRepository.countByRole("EMPLOYEE");
        metrics.setTotalEmployees(totalEmployees);

        // On Leave Today (approved leaves that overlap with today)
        LocalDate today = LocalDate.now();
        long onLeaveToday = leaveApplicationRepository.findApprovedLeavesOnDate(today).stream()
                .map(la -> la.getUser().getId())
                .distinct()
                .count();
        metrics.setOnLeaveToday(onLeaveToday);

        // Total Assistant Directors
        long assistantDirectors = userRepository.countByRole("ASSISTANT_DIRECTOR");
        metrics.setAssistantDirectors(assistantDirectors);

        // Total Project Managers
        long projectManagers = userRepository.countByRole("PROJECT_MANAGER");
        metrics.setProjectManagers(projectManagers);

        return metrics;
    }
}