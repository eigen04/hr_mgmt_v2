package com.hr_management.Controller;

import com.hr_management.Entity.*;
import com.hr_management.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hr")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/dashboard-metrics")
    @PreAuthorize("hasAnyRole('HR', 'DIRECTOR')")
    public ResponseEntity<DashboardMetrics> getDashboardMetrics() {
        DashboardMetrics metrics = dashboardService.getDashboardMetrics(); // Corrected typo
        return ResponseEntity.ok(metrics);
    }
}