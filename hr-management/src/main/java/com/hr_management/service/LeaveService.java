package com.hr_management.service;

import com.hr_management.Entity.LeaveApplication;
import com.hr_management.Entity.LeaveApplicationDTO;
import com.hr_management.Entity.User;
import com.hr_management.Entity.LeaveBalance;
import com.hr_management.Repository.LeaveApplicationRepository;
import com.hr_management.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LeaveService {

    private static final Logger logger = LoggerFactory.getLogger(LeaveService.class);

    @Autowired
    private LeaveApplicationRepository leaveApplicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Transactional
    public LeaveApplication applyLeave(LeaveApplication application) {
        logger.info("Applying leave for user: {}, type: {}", userService.getCurrentUser().getId(), application.getLeaveType());
        User user = userService.getCurrentUser();
        application.setUser(user);
        application.setStatus("PENDING");
        application.setAppliedOn(LocalDate.now());

        // Set the approver based on the user's role
        if (user.getRole().equals("HOD")) {
            User director = userService.findDirector();
            if (director == null) {
                logger.error("No Director found to approve HOD leave for user: {}", user.getId());
                throw new RuntimeException("No Director available to approve this leave. Please contact HR.");
            }
            application.setApproverId(director.getId());
        } else {
            User hod = userService.findHodByDepartment(user.getDepartment());
            if (hod == null) {
                logger.error("No HOD found in department {} to approve leave for user: {}", user.getDepartment(), user.getId());
                throw new RuntimeException("No HOD available in your department to approve this leave. Please contact HR.");
            }
            application.setApproverId(hod.getId());
        }

        // Ensure LeaveBalance is initialized
        LeaveBalance leaveBalance = user.getLeaveBalance();
        if (leaveBalance == null) {
            leaveBalance = new LeaveBalance();
            user.setLeaveBalance(leaveBalance);
            userRepository.save(user);
        }

        // Validate paternity leave (allow only one application)
        if (application.getLeaveType().equals("PL")) {
            List<LeaveApplication> existingPaternityLeaves = leaveApplicationRepository.findByUser(user)
                    .stream()
                    .filter(la -> la.getLeaveType().equals("PL") && (la.getStatus().equals("PENDING") || la.getStatus().equals("APPROVED")))
                    .collect(Collectors.toList());
            if (!existingPaternityLeaves.isEmpty()) {
                logger.warn("User {} attempted to apply for paternity leave again.", user.getId());
                throw new RuntimeException("You have already applied for or used your paternity leave.");
            }
        }

        // Calculate remaining leaves
        Map<String, Double> balance = calculateLeaveBalance(user);
        String effectiveLeaveType = application.getLeaveType().equals("HALF_DAY") ? "CL" : application.getLeaveType();
        double remainingLeaves = balance.getOrDefault(effectiveLeaveType, 0.0);

        // Validate leave balance
        double requiredDays = calculateRequiredDays(application.getLeaveType(), application.getStartDate(), application.getEndDate(), application.isHalfDay());
        if (remainingLeaves < requiredDays) {
            logger.warn("Insufficient leave balance for user: {}, type: {}, remaining: {}, required: {}", user.getId(), application.getLeaveType(), remainingLeaves, requiredDays);
            throw new RuntimeException("Insufficient " + application.getLeaveType() + " balance. Remaining: " + remainingLeaves);
        }

        application.setRemainingLeaves(remainingLeaves);
        LeaveApplication savedApplication = leaveApplicationRepository.save(application);
        logger.info("Leave application saved: ID {}", savedApplication.getId());
        return savedApplication;
    }

    public List<LeaveApplicationDTO> getPendingHodLeavesForDirector() {
        List<LeaveApplication> pendingHodLeaves = leaveApplicationRepository.findByStatusAndUserRole("PENDING", "HOD");
        return pendingHodLeaves.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public Map<String, Integer> getHodLeaveStats() {
        Map<String, Integer> stats = new HashMap<>();
        stats.put("pending", (int) leaveApplicationRepository.countByStatusAndUserRole("PENDING", "HOD"));
        stats.put("approved", (int) leaveApplicationRepository.countByStatusAndUserRole("APPROVED", "HOD"));
        stats.put("rejected", (int) leaveApplicationRepository.countByStatusAndUserRole("REJECTED", "HOD"));
        return stats;
    }

    public List<LeaveApplication> getUserLeaves() {
        User user = userService.getCurrentUser();
        return leaveApplicationRepository.findByUser(user);
    }

    public Map<String, Object> getLeaveBalance() {
        User user = userService.getCurrentUser();
        Map<String, Double> balance = calculateLeaveBalance(user);
        Map<String, Object> result = new HashMap<>();

        result.put("casualLeave", Map.of(
                "total", 12.0,
                "used", 12.0 - balance.getOrDefault("CL", 12.0),
                "remaining", balance.getOrDefault("CL", 12.0)
        ));
        result.put("earnedLeave", Map.of(
                "total", 20.0,
                "used", 20.0 - balance.getOrDefault("EL", 20.0),
                "remaining", balance.getOrDefault("EL", 20.0)
        ));
        if ("FEMALE".equalsIgnoreCase(user.getGender())) {
            result.put("maternityLeave", Map.of(
                    "total", 182.0,
                    "used", 182.0 - balance.getOrDefault("ML", 182.0),
                    "remaining", balance.getOrDefault("ML", 182.0)
            ));
        } else {
            result.put("paternityLeave", Map.of(
                    "total", 15.0,
                    "used", 15.0 - balance.getOrDefault("PL", 15.0),
                    "remaining", balance.getOrDefault("PL", 15.0)
            ));
        }

        return result;
    }

    private Map<String, Double> calculateLeaveBalance(User user) {
        LeaveBalance leaveBalance = user.getLeaveBalance();
        Map<String, Double> balance = new HashMap<>();

        if (leaveBalance == null) {
            balance.put("CL", 12.0);
            balance.put("EL", 20.0);
            if ("FEMALE".equalsIgnoreCase(user.getGender())) {
                balance.put("ML", 182.0);
            } else {
                balance.put("PL", 15.0);
            }
        } else {
            balance.put("CL", leaveBalance.getCasualLeaveRemaining());
            balance.put("EL", leaveBalance.getEarnedLeaveRemaining());
            if ("FEMALE".equalsIgnoreCase(user.getGender())) {
                balance.put("ML", leaveBalance.getMaternityLeaveRemaining());
            } else {
                balance.put("PL", leaveBalance.getPaternityLeaveRemaining());
            }
        }

        return balance;
    }

    private double calculateRequiredDays(String leaveType, LocalDate startDate, LocalDate endDate, boolean isHalfDay) {
        if (isHalfDay || leaveType.equals("HALF_DAY")) {
            return 0.5;
        }
        if (leaveType.equals("ML")) {
            return 182.0;
        }
        if (leaveType.equals("PL")) {
            return 15.0;
        }
        return ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }

    @Transactional
    public void approveLeave(Long leaveId) {
        logger.info("Approving leave application with ID: {}", leaveId);
        LeaveApplication leave = leaveApplicationRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave application not found"));
        User currentUser = userService.getCurrentUser();

        // Add null check for approverId
        Long approverId = leave.getApproverId();
        if (approverId == null) {
            logger.error("Approver ID is null for leave application ID: {}. Cannot approve.", leaveId);
            throw new RuntimeException("Cannot approve this leave: No approver assigned. Please contact HR.");
        }
        if (!approverId.equals(currentUser.getId())) {
            logger.warn("User {} attempted to approve leave {} they are not authorized for", currentUser.getId(), leaveId);
            throw new RuntimeException("You are not authorized to approve this leave");
        }
        if (!leave.getStatus().equals("PENDING")) {
            logger.warn("Leave application {} is already processed with status: {}", leaveId, leave.getStatus());
            throw new RuntimeException("Leave application is already processed");
        }

        User user = leave.getUser();
        LeaveBalance leaveBalance = user.getLeaveBalance();
        if (leaveBalance == null) {
            leaveBalance = new LeaveBalance();
            user.setLeaveBalance(leaveBalance);
        }

        if (leave.getLeaveType().equals("PL")) {
            List<LeaveApplication> approvedPaternityLeaves = leaveApplicationRepository.findByUserIdAndStatus(user.getId(), "APPROVED")
                    .stream()
                    .filter(la -> la.getLeaveType().equals("PL"))
                    .collect(Collectors.toList());
            if (!approvedPaternityLeaves.isEmpty()) {
                logger.warn("User {} already has an approved paternity leave.", user.getId());
                throw new RuntimeException("Paternity leave can only be taken once.");
            }
        }

        double days = calculateRequiredDays(leave.getLeaveType(), leave.getStartDate(), leave.getEndDate(), leave.isHalfDay());

        switch (leave.getLeaveType()) {
            case "CL":
            case "HALF_DAY":
                leaveBalance.setCasualLeaveUsed(leaveBalance.getCasualLeaveUsed() + days);
                leaveBalance.setCasualLeaveRemaining(leaveBalance.getCasualLeaveRemaining() - days);
                break;
            case "EL":
                leaveBalance.setEarnedLeaveUsed(leaveBalance.getEarnedLeaveUsed() + days);
                leaveBalance.setEarnedLeaveRemaining(leaveBalance.getEarnedLeaveRemaining() - days);
                break;
            case "ML":
                leaveBalance.setMaternityLeaveUsed(leaveBalance.getMaternityLeaveUsed() + days);
                leaveBalance.setMaternityLeaveRemaining(leaveBalance.getMaternityLeaveRemaining() - days);
                break;
            case "PL":
                leaveBalance.setPaternityLeaveUsed(leaveBalance.getPaternityLeaveUsed() + days);
                leaveBalance.setPaternityLeaveRemaining(leaveBalance.getPaternityLeaveRemaining() - days);
                break;
            default:
                logger.error("Invalid leave type: {}", leave.getLeaveType());
                throw new RuntimeException("Invalid leave type: " + leave.getLeaveType());
        }

        user.setLeaveBalance(leaveBalance);
        userRepository.save(user);

        leave.setStatus("APPROVED");
        Map<String, Double> updatedBalance = calculateLeaveBalance(user);
        leave.setRemainingLeaves(updatedBalance.getOrDefault(leave.getLeaveType(), 0.0));
        leaveApplicationRepository.save(leave);
        logger.info("Leave approved for user: {}. Updated balance: {}", user.getId(), leaveBalance);
    }

    @Transactional
    public void rejectLeave(Long leaveId) {
        logger.info("Rejecting leave application with ID: {}", leaveId);
        LeaveApplication leave = leaveApplicationRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave application not found"));
        User currentUser = userService.getCurrentUser();

        // Add null check for approverId
        Long approverId = leave.getApproverId();
        if (approverId == null) {
            logger.error("Approver ID is null for leave application ID: {}. Cannot reject.", leaveId);
            throw new RuntimeException("Cannot reject this leave: No approver assigned. Please contact HR.");
        }
        if (!approverId.equals(currentUser.getId())) {
            logger.warn("User {} attempted to reject leave {} they are not authorized for", currentUser.getId(), leaveId);
            throw new RuntimeException("You are not authorized to reject this leave");
        }
        leave.setStatus("REJECTED");
        leaveApplicationRepository.save(leave);
        logger.info("Leave rejected for application ID: {}", leaveId);
    }

    public List<LeaveApplicationDTO> getPendingLeavesByDepartment(String department) {
        List<LeaveApplication> leaveApplications = leaveApplicationRepository.findPendingByDepartment(department);
        return leaveApplications.stream().map(la -> {
            LeaveApplicationDTO dto = new LeaveApplicationDTO();
            dto.setId(la.getId());
            dto.setUserName(la.getUser().getFullName());
            dto.setLeaveType(la.getLeaveType());
            dto.setStartDate(la.getStartDate());
            dto.setEndDate(la.getEndDate());
            dto.setReason(la.getReason());
            dto.setStatus(la.getStatus());
            dto.setAppliedOn(la.getAppliedOn());
            dto.setRemainingLeaves((int) la.getRemainingLeaves());
            dto.setHalfDay(la.isHalfDay());
            return dto;
        }).collect(Collectors.toList());
    }

    public Map<String, Integer> getDepartmentStats(String department) {
        Map<String, Integer> stats = new HashMap<>();
        long totalMembers = userRepository.countByDepartment(department);
        List<LeaveApplication> onLeave = leaveApplicationRepository.findCurrentlyOnLeaveByDepartment(department);
        stats.put("totalMembers", (int) totalMembers);
        stats.put("onLeave", onLeave.size());
        return stats;
    }

    public List<LeaveApplication> getApprovedLeavesByEmployee(Long employeeId) {
        return leaveApplicationRepository.findByUserIdAndStatus(employeeId, "APPROVED");
    }

    private LeaveApplicationDTO convertToDTO(LeaveApplication leave) {
        LeaveApplicationDTO dto = new LeaveApplicationDTO();
        dto.setId(leave.getId());
        dto.setUserName(leave.getUser().getFullName());
        dto.setDepartment(leave.getUser().getDepartment());
        dto.setLeaveType(leave.getLeaveType());
        dto.setStartDate(leave.getStartDate());
        dto.setEndDate(leave.getEndDate());
        dto.setReason(leave.getReason());
        dto.setStatus(leave.getStatus());
        dto.setAppliedOn(leave.getAppliedOn());
        dto.setRemainingLeaves((int) leave.getRemainingLeaves());
        dto.setHalfDay(leave.isHalfDay());
        return dto;
    }
}