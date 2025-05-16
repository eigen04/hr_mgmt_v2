package com.hr_management.Controller;

import com.hr_management.Entity.Department;
import com.hr_management.Entity.User;
import com.hr_management.Entity.LeaveApplication;
import com.hr_management.Entity.LeaveApplicationDTO;
import com.hr_management.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

class EmployeeDTO {
    private Long id;
    private String fullName;
    private String role;
    private List<LeaveApplicationDTO> leaveApplications;

    // Getters and Setters
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
@CrossOrigin(origins = "http://localhost:5173") // Add CORS for frontend
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    // Add a new department (Director only)
    @PostMapping("/departments")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<Map<String, String>> addDepartment(@RequestBody Department department) {
        try {
            departmentService.addDepartment(department);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Department added successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(400).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Failed to add department: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // Fetch department stats (total departments and active HODs) (Director only)
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

    // Fetch all departments (HR only)
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

    // Fetch employees in a department with their leave applications (HR only)
    @GetMapping("/hr/departments/{deptId}/employees")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<EmployeeDTO>> getEmployeesInDepartment(@PathVariable Long deptId) {
        try {
            List<User> employees = departmentService.getEmployeesByDepartmentId(deptId);
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
                    // Normalize leaveType
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
                        leaveType = "CASUAL"; // Assume HALF-DAY is a casual leave
                        leaveDTO.setHalfDay(true); // Ensure isHalfDay is set
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