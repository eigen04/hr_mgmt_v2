package com.hr_management.Controller;

import com.hr_management.Entity.Department;
import com.hr_management.Entity.DepartmentMetrics;
import com.hr_management.Entity.User;
import com.hr_management.service.DepartmentService;
import com.hr_management.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/hr")
public class DepartmentMetricsController {

    @Autowired
    private DepartmentService departmentService;

    @Autowired
    private UserService userService;

    @GetMapping("/department-metrics/{departmentId}")
    @PreAuthorize("hasAnyRole('DIRECTOR', 'ASSISTANT_DIRECTOR', 'PROJECT_MANAGER')")
    public ResponseEntity<?> getDepartmentMetrics(@PathVariable String departmentId) {
        try {
            // Validate departmentId
            Long deptId;
            try {
                deptId = Long.parseLong(departmentId);
                if (deptId <= 0) {
                    return ResponseEntity.status(400).body("Invalid department ID: Must be a positive number");
                }
            } catch (NumberFormatException e) {
                return ResponseEntity.status(400).body("Invalid department ID: Must be a valid number");
            }

            // Get the current user and their role
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            User currentUser = userService.getCurrentUser();
            String userRole = currentUser.getRole();
            String userDepartment = currentUser.getDepartment();

            // Fetch the department to get its name
            Optional<Department> departmentOpt = departmentService.getDepartmentById(deptId);
            if (departmentOpt.isEmpty()) {
                return ResponseEntity.status(404).body("Department not found");
            }
            String requestedDepartmentName = departmentOpt.get().getName();

            // Restrict ASSISTANT_DIRECTOR to their own department
            if (userRole.equals("ASSISTANT_DIRECTOR")) {
                if (!requestedDepartmentName.equals(userDepartment)) {
                    return ResponseEntity.status(403).body("You do not have permission to access this department's metrics");
                }
            }
            if (userRole.equals("PROJECT_MANAGER")) {
                if (!requestedDepartmentName.equals(userDepartment)) {
                    return ResponseEntity.status(403).body("You do not have permission to access this department's metrics");
                }
            }
            // Fetch department metrics
            DepartmentMetrics metrics = departmentService.getDepartmentMetrics(deptId);
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("An error occurred while fetching department metrics: " + e.getMessage());
        }
    }
}