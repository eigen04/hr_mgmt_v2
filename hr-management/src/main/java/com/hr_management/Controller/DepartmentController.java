package com.hr_management.Controller;

import com.hr_management.Entity.*;
import com.hr_management.service.DepartmentService;
import com.hr_management.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

class EmployeeDTO {
    private Long id;
    private String fullName;
    private String role;
    private List<LeaveApplicationDTO> leaveApplications;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public List<LeaveApplicationDTO> getLeaveApplications() { return leaveApplications; }
    public void setLeaveApplications(List<LeaveApplicationDTO> leaveApplications) { this.leaveApplications = leaveApplications; }
}

@RestController
@RequestMapping("/api")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    @Autowired
    private UserService userService;

    @PostMapping("/departments")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<Map<String, Object>> addDepartment(@RequestBody Department department) {
        try {
            Department savedDepartment = departmentService.addDepartment(department);
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedDepartment.getId());
            response.put("name", savedDepartment.getName());
            response.put("description", savedDepartment.getDescription());
            response.put("employeeCount", savedDepartment.getEmployeeCount());
            response.put("onLeaveCount", savedDepartment.getOnLeaveCount());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(400).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Failed to add department: " + e.getMessage());
            errorResponse.put("status", "error");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/departments/stats")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<Map<String, Integer>> getDepartmentStats() {
        try {
            int totalDepartments = departmentService.getTotalDepartments();
            int activeHods = departmentService.getActiveHods();
            Map<String, Integer> stats = new HashMap<>();
            stats.put("totalDepartments", totalDepartments);
            stats.put("activeHods", activeHods);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Integer> errorStats = new HashMap<>();
            errorStats.put("totalDepartments", 0);
            errorStats.put("activeHods", 0);
            return ResponseEntity.status(500).body(errorStats);
        }
    }

    @GetMapping("/hr/departments")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<Department>> getAllDepartments() {
        try {
            List<Department> departments = departmentService.getAllDepartments();
            return ResponseEntity.ok(departments);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of());
        }
    }

    @GetMapping("/hr/departments/{deptId}/employees")
    @PreAuthorize("hasAnyRole('HR', 'DIRECTOR', 'ASSISTANT_DIRECTOR', 'PROJECT_MANAGER')")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesInDepartment(@PathVariable Long deptId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            User currentUser = userService.getCurrentUser();
            String userRole = currentUser.getRole();
            // Use department ID for comparison
            Long userDepartmentId = currentUser.getDepartmentEntity() != null 
                ? currentUser.getDepartmentEntity().getId() 
                : null;

            Optional<Department> departmentOpt = departmentService.getDepartmentById(deptId);
            if (departmentOpt.isEmpty()) {
                return ResponseEntity.status(404).body(List.of());
            }

            // Restrict access for ASSISTANT_DIRECTOR and PROJECT_MANAGER to their own department
            if (userRole.equals("ASSISTANT_DIRECTOR") || userRole.equals("PROJECT_MANAGER")) {
                if (userDepartmentId == null || !userDepartmentId.equals(deptId)) {
                    return ResponseEntity.status(403).body(List.of());
                }
            }

            // Fetch employees, filtered by reportingTo for PROJECT_MANAGER
            List<User> employees = departmentService.getEmployeesByDepartmentId(deptId, currentUser.getId(), userRole);
            List<EmployeeDTO> employeeDTOs = employees.stream().map(employee -> {
                EmployeeDTO dto = new EmployeeDTO();
                dto.setId(employee.getId());
                dto.setFullName(employee.getFullName());
                dto.setRole(employee.getRole());
                List<LeaveApplication> leaveApplications = departmentService.getLeaveApplicationsByUserId(employee.getId());
                List<LeaveApplicationDTO> leaveDTOs = leaveApplications.stream().map(leave -> {
                    LeaveApplicationDTO leaveDTO = new LeaveApplicationDTO();
                    leaveDTO.setId(leave.getId());
                    leaveDTO.setUserName(leave.getUser().getUsername());
                    String leaveType = leave.getLeaveType();
                    if ("CL".equalsIgnoreCase(leaveType)) {
                        leaveType = "CASUAL";
                    } else if ("EL".equalsIgnoreCase(leaveType)) {
                        leaveType = "EARNED";
                    } else if ("PL".equalsIgnoreCase(leaveType)) {
                        leaveType = "PATERNITY";
                    } else if ("ML".equalsIgnoreCase(leaveType)) {
                        leaveType = "MATERNITY";
                    } else if ("HALF-DAY".equalsIgnoreCase(leaveType)) {
                        leaveType = "CASUAL";
                        leaveDTO.setHalfDay(true);
                    }
                    leaveDTO.setLeaveType(leaveType.toUpperCase());
                    leaveDTO.setStartDate(leave.getStartDate());
                    leaveDTO.setEndDate(leave.getEndDate());
                    leaveDTO.setReason(leave.getReason());
                    leaveDTO.setStatus(leave.getStatus());
                    leaveDTO.setAppliedOn(leave.getAppliedOn());
                    leaveDTO.setRemainingLeaves((int) leave.getRemainingLeaves());
                    leaveDTO.setHalfDay(leave.isHalfDay());
                    return leaveDTO;
                }).collect(Collectors.toList());
                dto.setLeaveApplications(leaveDTOs);
                return dto;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(employeeDTOs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of());
        }
    }
}