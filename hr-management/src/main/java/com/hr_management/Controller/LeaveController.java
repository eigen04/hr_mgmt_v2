package com.hr_management.Controller;

import com.hr_management.Entity.LeaveApplication;
import com.hr_management.Entity.LeaveApplicationDTO;
import com.hr_management.Entity.User;
import com.hr_management.service.LeaveService;
import com.hr_management.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private static final Logger logger = LoggerFactory.getLogger(LeaveController.class);

    @Autowired
    private LeaveService leaveService;

    @Autowired
    private UserService userService;

    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'HOD')") // Allow both EMPLOYEE and HOD to apply for leave
    public ResponseEntity<?> applyLeave(@RequestBody LeaveApplication application) {
        try {
            LeaveApplication savedApplication = leaveService.applyLeave(application);
            return ResponseEntity.ok(savedApplication);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "An error occurred: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<LeaveApplication>> getUserLeaves() {
        List<LeaveApplication> leaves = leaveService.getUserLeaves();
        return ResponseEntity.ok(leaves);
    }

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> getLeaveBalance() {
        Map<String, Object> balance = leaveService.getLeaveBalance();
        return ResponseEntity.ok(balance);
    }

    @GetMapping("/department/pending")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<List<LeaveApplicationDTO>> getPendingLeavesByDepartment() {
        User user = userService.getCurrentUser();
        String departmentName = user.getDepartment();
        List<LeaveApplicationDTO> leaves = leaveService.getPendingLeavesByDepartment(departmentName);
        return ResponseEntity.ok(leaves);
    }

    @GetMapping("/department/stats")
    @PreAuthorize("hasRole('HOD')")
    public ResponseEntity<Map<String, Integer>> getDepartmentStats() {
        User user = userService.getCurrentUser();
        String departmentName = user.getDepartment();
        Map<String, Integer> stats = leaveService.getDepartmentStats(departmentName);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/hod/pending")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<List<LeaveApplicationDTO>> getPendingHodLeaves() {
        try {
            List<LeaveApplicationDTO> leaves = leaveService.getPendingHodLeavesForDirector();
            return ResponseEntity.ok(leaves);
        } catch (Exception e) {
            logger.error("Error fetching pending HOD leaves: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }

    @GetMapping("/hod/stats")
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<Map<String, Integer>> getHodLeaveStats() {
        Map<String, Integer> stats = leaveService.getHodLeaveStats();
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('HOD', 'DIRECTOR')")
    public ResponseEntity<String> approveLeave(@PathVariable Long id) {
        leaveService.approveLeave(id);
        return ResponseEntity.ok("Leave approved successfully");
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('HOD', 'DIRECTOR')")
    public ResponseEntity<String> rejectLeave(@PathVariable Long id) {
        leaveService.rejectLeave(id);
        return ResponseEntity.ok("Leave rejected successfully");
    }
}
