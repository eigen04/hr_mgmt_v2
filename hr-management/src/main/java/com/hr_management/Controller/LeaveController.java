package com.hr_management.Controller;

import com.hr_management.Entity.LeaveApplication;
import com.hr_management.Entity.LeaveApplicationDTO;
import com.hr_management.service.LeaveService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private static final Logger logger = LoggerFactory.getLogger(LeaveController.class);

    @Autowired
    private LeaveService leaveService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> applyLeave(@RequestBody LeaveApplication application, HttpServletRequest request) {
        logger.info("Received leave application request. Content-Type: {}, Payload: {}",
                request.getContentType(), application);
        logger.debug("Request Headers: {}", Collections.list(request.getHeaderNames()).stream()
                .collect(Collectors.toMap(name -> name, request::getHeader)));
        try {
            application.setUser(null);
            LeaveApplication savedApplication = leaveService.applyLeave(application);
            return ResponseEntity.ok(savedApplication);
        } catch (RuntimeException e) {
            logger.warn("Failed to apply leave: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error applying leave: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "An unexpected error occurred: " + e.getMessage()));
        }
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<LeaveApplication>> getUserLeaves() {
        logger.info("Fetching leave applications for current user");
        try {
            List<LeaveApplication> leaves = leaveService.getUserLeaves();
            return ResponseEntity.ok(leaves);
        } catch (Exception e) {
            logger.error("Error fetching user leaves: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

    @GetMapping(value = "/available-cl/{year}/{month}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getAvailableClForMonth(@PathVariable int year, @PathVariable int month) {
        logger.info("Fetching available CL for year: {}, month: {}", year, month);
        try {
            if (year < 2000 || year > LocalDate.now().getYear() + 1) {
                throw new RuntimeException("Invalid year: " + year);
            }
            if (month < 1 || month > 12) {
                throw new RuntimeException("Invalid month: " + month);
            }
            Map<String, Double> availableCl = leaveService.getAvailableClForMonth(year, month);
            return ResponseEntity.ok(availableCl);
        } catch (RuntimeException e) {
            logger.warn("Failed to fetch available CL: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error fetching available CL: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "An unexpected error occurred"));
        }
    }

    @GetMapping(value = "/balance", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getLeaveBalance() {
        logger.info("Fetching leave balance for current user");
        try {
            Map<String, Object> balance = leaveService.getLeaveBalance();
            return ResponseEntity.ok(balance);
        } catch (Exception e) {
            logger.error("Error fetching leave balance: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "Error fetching leave balance"));
        }
    }

    @GetMapping(value = "/pending", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<LeaveApplicationDTO>> getPendingLeavesForCurrentUser() {
        logger.info("Fetching pending leave applications for current user");
        try {
            List<LeaveApplicationDTO> leaves = leaveService.getPendingLeavesForCurrentUser();
            return ResponseEntity.ok(leaves);
        } catch (Exception e) {
            logger.error("Error fetching pending leaves: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

    @GetMapping(value = "/cancellable", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<LeaveApplicationDTO>> getCancellableLeavesForCurrentUser() {
        logger.info("Fetching cancellable leave applications for current user");
        try {
            List<LeaveApplicationDTO> leaves = leaveService.getCancellableLeavesForCurrentUser();
            return ResponseEntity.ok(leaves);
        } catch (Exception e) {
            logger.error("Error fetching cancellable leaves: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

    @GetMapping(value = "/stats", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Integer>> getLeaveStatsForCurrentUser() {
        logger.info("Fetching leave stats for current user");
        try {
            Map<String, Integer> stats = leaveService.getLeaveStatsForCurrentUser();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error fetching leave stats: {}", e.getMessage(), e);
            Map<String, Integer> errorStats = new HashMap<>();
            errorStats.put("pending", 0);
            errorStats.put("approved", 0);
            errorStats.put("rejected", 0);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorStats);
        }
    }

    @PostMapping(value = "/{id}/approve", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> approveLeave(@PathVariable Long id) {
        logger.info("Approving leave application ID: {}", id);
        try {
            leaveService.approveLeave(id);
            return ResponseEntity.ok(Collections.singletonMap("message", "Leave approved successfully"));
        } catch (RuntimeException e) {
            logger.warn("Failed to approve leave: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error approving leave: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "An unexpected error occurred"));
        }
    }

    @PostMapping(value = "/{id}/reject", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> rejectLeave(@PathVariable Long id) {
        logger.info("Rejecting leave application ID: {}", id);
        try {
            leaveService.rejectLeave(id);
            return ResponseEntity.ok(Collections.singletonMap("message", "Leave rejected successfully"));
        } catch (RuntimeException e) {
            logger.warn("Failed to reject leave: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error rejecting leave: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "An unexpected error occurred"));
        }
    }

    @PostMapping(value = "/{id}/cancel", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> cancelLeave(@PathVariable Long id) {
        logger.info("Cancelling leave application ID: {}", id);
        try {
            leaveService.cancelLeave(id);
            return ResponseEntity.ok(Collections.singletonMap("message", "Leave cancelled successfully"));
        } catch (RuntimeException e) {
            logger.warn("Failed to cancel leave: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Unexpected error cancelling leave: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "An unexpected error occurred"));
        }
    }
}