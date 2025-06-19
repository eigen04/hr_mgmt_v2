package com.hr_management.Controller;

import com.hr_management.Entity.LeaveApplication;
import com.hr_management.Entity.LeaveApplicationDTO;
import com.hr_management.Entity.User;
import com.hr_management.service.LeaveService;
import com.hr_management.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<?> applyLeave(@RequestBody LeaveApplication application) {
        try {
            LeaveApplication savedApplication = leaveService.applyLeave(application);
            return ResponseEntity.ok(savedApplication);
        } catch (RuntimeException e) {
            logger.warn("Failed to apply leave: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error applying leave: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "An unexpected error occurred while applying the leave: " + e.getMessage()));
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

    @GetMapping("/pending")
    public ResponseEntity<List<LeaveApplicationDTO>> getPendingLeavesForCurrentUser() {
        try {
            List<LeaveApplicationDTO> leaves = leaveService.getPendingLeavesForCurrentUser();
            return ResponseEntity.ok(leaves);
        } catch (Exception e) {
            logger.error("Error fetching pending leaves: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Integer>> getLeaveStatsForCurrentUser() {
        Map<String, Integer> stats = leaveService.getLeaveStatsForCurrentUser();
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<String> approveLeave(@PathVariable Long id) {
        leaveService.approveLeave(id);
        return ResponseEntity.ok("Leave approved successfully");
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<String> rejectLeave(@PathVariable Long id) {
        leaveService.rejectLeave(id);
        return ResponseEntity.ok("Leave rejected successfully");
    }
}