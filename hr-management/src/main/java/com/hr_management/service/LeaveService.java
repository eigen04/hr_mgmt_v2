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
import java.time.DayOfWeek;
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

    private static final double LWP_ANNUAL_LIMIT = 300.0; // Annual limit for LWP

    @Transactional
    public LeaveApplication applyLeave(LeaveApplication application) {
        logger.info("Applying leave for user: {}, type: {}", userService.getCurrentUser().getId(), application.getLeaveType());
        User user = userService.getCurrentUser();

        // Prevent Assistant Directors from applying leaves
        if (user.getRole().equals("ASSISTANT_DIRECTOR")) {
            logger.warn("Assistant Director {} attempted to apply for leave", user.getId());
            throw new RuntimeException("Assistant Directors are not required to apply for leaves.");
        }

        // Prevent Admins (Director) from applying leaves
        if (user.getRole().equals("ADMIN")) {
            logger.warn("Admin {} attempted to apply for leave", user.getId());
            throw new RuntimeException("As the Director, you cannot apply for leaves.");
        }

        application.setUser(user);
        application.setStatus("PENDING");
        application.setAppliedOn(LocalDate.now());

        // Validation: Prevent past start dates
        LocalDate today = LocalDate.now();
        if (application.getStartDate().isBefore(today)) {
            logger.warn("Attempted to apply leave with past start date: {} for user: {}", application.getStartDate(), user.getId());
            throw new RuntimeException("Start date cannot be in the past");
        }

        // Set fixed end date for maternity and paternity leaves
        if (application.getLeaveType().equals("ML")) {
            if (!"FEMALE".equalsIgnoreCase(user.getGender())) {
                logger.warn("User {} (gender: {}) attempted to apply for maternity leave", user.getId(), user.getGender());
                throw new RuntimeException("Maternity leave is only available for female employees");
            }
            application.setEndDate(application.getStartDate().plusDays(181)); // 182 days total
        } else if (application.getLeaveType().equals("PL")) {
            if (!"MALE".equalsIgnoreCase(user.getGender())) {
                logger.warn("User {} (gender: {}) attempted to apply for paternity leave", user.getId(), user.getGender());
                throw new RuntimeException("Paternity leave is only available for male employees");
            }
            application.setEndDate(application.getStartDate().plusDays(14)); // 15 days total
        }

        // Set approver using the reportingTo field
        User approver = user.getReportingTo();
        if (approver == null) {
            logger.error("No reporting person found for user: {}. Role: {}", user.getId(), user.getRole());
            throw new RuntimeException("No reporting person available to approve this leave. Please contact HR.");
        }
        application.setApproverId(approver.getId());

        // Initialize leave balance if null
        LeaveBalance leaveBalance = user.getLeaveBalance();
        if (leaveBalance == null) {
            leaveBalance = new LeaveBalance();
            leaveBalance.setCasualLeaveRemaining(12.0);
            leaveBalance.setCasualLeaveUsed(0.0);
            leaveBalance.setEarnedLeaveRemaining(20.0);
            leaveBalance.setEarnedLeaveUsed(0.0);
            if ("FEMALE".equalsIgnoreCase(user.getGender())) {
                leaveBalance.setMaternityLeaveRemaining(182.0);
                leaveBalance.setMaternityLeaveUsed(0.0);
            } else {
                leaveBalance.setPaternityLeaveRemaining(15.0);
                leaveBalance.setPaternityLeaveUsed(0.0);
            }
            user.setLeaveBalance(leaveBalance);
            userRepository.save(user);
        }

        // For Half-Day leaves, set end date same as start date and mark as half-day
        if (application.getLeaveType().equals("HALF_DAY_CL") || application.getLeaveType().equals("HALF_DAY_EL") || application.getLeaveType().equals("HALF_DAY_LWP")) {
            application.setEndDate(application.getStartDate());
            application.setHalfDay(true);
        }

        // Check for overlapping leaves
        LocalDate effectiveEndDate = application.getEndDate();
        List<LeaveApplication> overlappingLeaves = leaveApplicationRepository.findOverlappingLeaves(
                user, application.getStartDate(), effectiveEndDate);
        if (!overlappingLeaves.isEmpty()) {
            StringBuilder errorMessage = new StringBuilder(
                    "You already have a pending or approved leave application overlapping with the dates " +
                            application.getStartDate() + " to " + effectiveEndDate + ". Overlapping applications:\n");
            for (LeaveApplication overlapping : overlappingLeaves) {
                errorMessage.append(String.format("- %s from %s to %s (Status: %s)\n",
                        overlapping.getLeaveType(), overlapping.getStartDate(), overlapping.getEndDate(), overlapping.getStatus()));
            }
            errorMessage.append("Please wait until they are processed or rejected.");
            logger.warn("User {} has overlapping leave applications for dates: {} to {}. Details: {}", 
                    user.getId(), application.getStartDate(), effectiveEndDate, errorMessage);
            throw new RuntimeException(errorMessage.toString());
        }

        // Validate half-day leave on the same date and ensure it's on a working day
        if (application.getLeaveType().equals("HALF_DAY_CL") || application.getLeaveType().equals("HALF_DAY_EL") || application.getLeaveType().equals("HALF_DAY_LWP")) {
            LocalDate startDate = application.getStartDate();
            if (isNonWorkingDay(startDate)) {
                logger.warn("User {} attempted to apply half-day leave on a non-working day: {}", user.getId(), startDate);
                throw new RuntimeException("Half-day leave cannot be applied on a non-working day (second/fourth Saturday or Sunday)");
            }
            List<LeaveApplication> existingLeaves = leaveApplicationRepository.findByUserAndStartDate(user, startDate);
            boolean hasHalfDayLeave = existingLeaves.stream()
                    .anyMatch(leave -> (leave.getLeaveType().equals("HALF_DAY_CL") || leave.getLeaveType().equals("HALF_DAY_EL") || leave.getLeaveType().equals("HALF_DAY_LWP"))
                            && (leave.getStatus().equals("PENDING") || leave.getStatus().equals("APPROVED")));
            if (hasHalfDayLeave) {
                logger.warn("User {} already has a half-day leave on date: {}", user.getId(), startDate);
                throw new RuntimeException("You already have a half-day leave application (pending or approved) on " + startDate + ". Multiple half-day leaves on the same date are not allowed.");
            }
        }

        // Calculate leave balance
        Map<String, Double> balance = calculateLeaveBalance(user);
        String effectiveLeaveType = application.getLeaveType();
        if (application.getLeaveType().equals("HALF_DAY_CL")) {
            effectiveLeaveType = "CL";
        } else if (application.getLeaveType().equals("HALF_DAY_EL")) {
            effectiveLeaveType = "EL";
        } else if (application.getLeaveType().equals("HALF_DAY_LWP")) {
            effectiveLeaveType = "LWP";
        }

        double requiredDays = calculateRequiredDays(application.getLeaveType(), application.getStartDate(), application.getEndDate(), application.isHalfDay());
        logger.info("Calculated required days for leave application: {}, type: {}: {}", application.getId(), application.getLeaveType(), requiredDays);

        // Check balance for all leave types, including LWP
        double remainingLeaves = balance.getOrDefault(effectiveLeaveType, 0.0);
        if (remainingLeaves < requiredDays) {
            logger.warn("Insufficient leave balance for user: {}, type: {}, remaining: {}, required: {}", user.getId(), application.getLeaveType(), remainingLeaves, requiredDays);
            throw new RuntimeException("Insufficient " + effectiveLeaveType + " balance. Remaining: " + remainingLeaves);
        }

        // Validate ML/PL total usage
        if (application.getLeaveType().equals("ML")) {
            double totalMaternityLeaveUsed = leaveBalance.getMaternityLeaveUsed() + requiredDays;
            if (totalMaternityLeaveUsed > 182.0) {
                logger.warn("Total maternity leave exceeds 182 days for user: {}", user.getId());
                throw new RuntimeException("Total maternity leave cannot exceed 182 days. You have already used " + leaveBalance.getMaternityLeaveUsed() + " days.");
            }
        } else if (application.getLeaveType().equals("PL")) {
            double totalPaternityLeaveUsed = leaveBalance.getPaternityLeaveUsed() + requiredDays;
            if (totalPaternityLeaveUsed > 15.0) {
                logger.warn("Total paternity leave exceeds 15 days for user: {}", user.getId());
                throw new RuntimeException("Total paternity leave cannot exceed 15 days. You have already used " + leaveBalance.getPaternityLeaveUsed() + " days.");
            }
        }

        application.setRemainingLeaves(remainingLeaves);
        LeaveApplication savedApplication = leaveApplicationRepository.save(application);
        logger.info("Leave application saved: ID {}", savedApplication.getId());
        return savedApplication;
    }

    public List<LeaveApplicationDTO> getPendingLeavesForCurrentUser() {
        User currentUser = userService.getCurrentUser();
        String userRole = currentUser.getRole();
        List<LeaveApplication> pendingLeaves;

        if (userRole.equals("ASSISTANT_DIRECTOR")) {
            // Assistant Directors should only see leaves from their own department
            String userDepartment = currentUser.getDepartment();
            pendingLeaves = leaveApplicationRepository.findByApproverIdAndStatus(currentUser.getId(), "PENDING")
                    .stream()
                    .filter(leave -> leave.getUser().getDepartment().equals(userDepartment))
                    .collect(Collectors.toList());
        } else {
            // PROJECT_MANAGER and DIRECTOR can see all leaves assigned to them
            pendingLeaves = leaveApplicationRepository.findByApproverIdAndStatus(currentUser.getId(), "PENDING");
        }

        return pendingLeaves.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public Map<String, Integer> getLeaveStatsForCurrentUser() {
        User currentUser = userService.getCurrentUser();
        String userRole = currentUser.getRole();
        Map<String, Integer> stats = new HashMap<>();

        if (userRole.equals("ASSISTANT_DIRECTOR")) {
            // Assistant Directors should only count leaves from their own department
            String userDepartment = currentUser.getDepartment();
            long pending = leaveApplicationRepository.findByApproverIdAndStatus(currentUser.getId(), "PENDING")
                    .stream()
                    .filter(leave -> leave.getUser().getDepartment().equals(userDepartment))
                    .count();
            long approved = leaveApplicationRepository.findByApproverIdAndStatus(currentUser.getId(), "APPROVED")
                    .stream()
                    .filter(leave -> leave.getUser().getDepartment().equals(userDepartment))
                    .count();
            long rejected = leaveApplicationRepository.findByApproverIdAndStatus(currentUser.getId(), "REJECTED")
                    .stream()
                    .filter(leave -> leave.getUser().getDepartment().equals(userDepartment))
                    .count();

            stats.put("pending", (int) pending);
            stats.put("approved", (int) approved);
            stats.put("rejected", (int) rejected);
        } else {
            // PROJECT_MANAGER and DIRECTOR can see stats for all leaves assigned to them
            stats.put("pending", (int) leaveApplicationRepository.countByApproverIdAndStatus(currentUser.getId(), "PENDING"));
            stats.put("approved", (int) leaveApplicationRepository.countByApproverIdAndStatus(currentUser.getId(), "APPROVED"));
            stats.put("rejected", (int) leaveApplicationRepository.countByApproverIdAndStatus(currentUser.getId(), "REJECTED"));
        }

        return stats;
    }

    public List<LeaveApplication> getUserLeaves() {
        User user = userService.getCurrentUser();
        return leaveApplicationRepository.findByUser(user);
    }

    public Map<String, Object> getLeaveBalance() {
        User user = userService.getCurrentUser();

        // Assistant Directors and Admins do not have leave balances
        if (user.getRole().equals("ASSISTANT_DIRECTOR") || user.getRole().equals("ADMIN")) {
            return new HashMap<>();
        }

        LeaveBalance leaveBalance = user.getLeaveBalance();
        Map<String, Object> result = new HashMap<>();

        // Initialize leave balance if null
        if (leaveBalance == null) {
            leaveBalance = new LeaveBalance();
            leaveBalance.setCasualLeaveRemaining(12.0);
            leaveBalance.setCasualLeaveUsed(0.0);
            leaveBalance.setEarnedLeaveRemaining(20.0);
            leaveBalance.setEarnedLeaveUsed(0.0);
            if ("FEMALE".equalsIgnoreCase(user.getGender())) {
                leaveBalance.setMaternityLeaveRemaining(182.0);
                leaveBalance.setMaternityLeaveUsed(0.0);
            } else {
                leaveBalance.setPaternityLeaveRemaining(15.0);
                leaveBalance.setPaternityLeaveUsed(0.0);
            }
            user.setLeaveBalance(leaveBalance);
            userRepository.save(user);
        }

        // Recalculate used days for each leave type
        double clUsed = calculateTotalUsedDays(user, List.of("CL", "HALF_DAY_CL"));
        double elUsed = calculateTotalUsedDays(user, List.of("EL", "HALF_DAY_EL"));
        double mlUsed = calculateTotalUsedDays(user, List.of("ML"));
        double plUsed = calculateTotalUsedDays(user, List.of("PL"));

        // Update leave balance with recalculated values
        leaveBalance.setCasualLeaveUsed(clUsed);
        leaveBalance.setCasualLeaveRemaining(12.0 - clUsed);
        leaveBalance.setEarnedLeaveUsed(elUsed);
        leaveBalance.setEarnedLeaveRemaining(20.0 - elUsed);
        if ("FEMALE".equalsIgnoreCase(user.getGender())) {
            leaveBalance.setMaternityLeaveUsed(mlUsed);
            leaveBalance.setMaternityLeaveRemaining(182.0 - mlUsed);
        } else {
            leaveBalance.setPaternityLeaveUsed(plUsed);
            leaveBalance.setPaternityLeaveRemaining(15.0 - plUsed);
        }
        userRepository.save(user);

        // Calculate LWP usage for the current year (2025)
        LocalDate startOfYear = LocalDate.of(2025, 1, 1);
        LocalDate endOfYear = LocalDate.of(2025, 12, 31);
        List<LeaveApplication> lwpApplications = leaveApplicationRepository.findByUserAndLeaveTypeInAndStartDateBetween(
                user, List.of("LWP", "HALF_DAY_LWP"), startOfYear, endOfYear);

        double totalLwpUsed = lwpApplications.stream()
                .filter(app -> app.getStatus().equals("APPROVED"))
                .mapToDouble(app -> calculateRequiredDays(app.getLeaveType(), app.getStartDate(), app.getEndDate(), app.isHalfDay()))
                .sum();
        double remainingLwp = LWP_ANNUAL_LIMIT - totalLwpUsed;

        // Populate result map
        result.put("casualLeave", Map.of(
                "total", 12.0,
                "used", Math.round(clUsed * 10.0) / 10.0,
                "remaining", Math.round((12.0 - clUsed) * 10.0) / 10.0
        ));
        result.put("earnedLeave", Map.of(
                "total", 20.0,
                "used", Math.round(elUsed * 10.0) / 10.0,
                "remaining", Math.round((20.0 - elUsed) * 10.0) / 10.0
        ));
        if ("FEMALE".equalsIgnoreCase(user.getGender())) {
            result.put("maternityLeave", Map.of(
                    "total", 182.0,
                    "used", Math.round(mlUsed * 10.0) / 10.0,
                    "remaining", Math.round((182.0 - mlUsed) * 10.0) / 10.0
            ));
        } else {
            result.put("paternityLeave", Map.of(
                    "total", 15.0,
                    "used", Math.round(plUsed * 10.0) / 10.0,
                    "remaining", Math.round((15.0 - plUsed) * 10.0) / 10.0
            ));
        }
        result.put("leaveWithoutPay", Map.of(
                "total", LWP_ANNUAL_LIMIT,
                "used", Math.round(totalLwpUsed * 10.0) / 10.0,
                "remaining", Math.round(Math.max(0, remainingLwp) * 10.0) / 10.0
        ));

        // Log the balances based on gender
        if ("FEMALE".equalsIgnoreCase(user.getGender())) {
            logger.info("Fetched leave balance for user {}: CL used {}, remaining {}; EL used {}, remaining {}; ML used {}, remaining {}; LWP used {}, remaining {}", 
                        user.getId(), 
                        clUsed, leaveBalance.getCasualLeaveRemaining(),
                        elUsed, leaveBalance.getEarnedLeaveRemaining(),
                        mlUsed, leaveBalance.getMaternityLeaveRemaining(),
                        totalLwpUsed, remainingLwp);
        } else {
            logger.info("Fetched leave balance for user {}: CL used {}, remaining {}; EL used {}, remaining {}; PL used {}, remaining {}; LWP used {}, remaining {}", 
                        user.getId(), 
                        clUsed, leaveBalance.getCasualLeaveRemaining(),
                        elUsed, leaveBalance.getEarnedLeaveRemaining(),
                        plUsed, leaveBalance.getPaternityLeaveRemaining(),
                        totalLwpUsed, remainingLwp);
        }
        return result;
    }

    private double calculateTotalUsedDays(User user, List<String> leaveTypes) {
        List<LeaveApplication> approvedLeaves = leaveApplicationRepository.findByUserAndStatus(user, "APPROVED")
                .stream()
                .filter(leave -> leaveTypes.contains(leave.getLeaveType()))
                .collect(Collectors.toList());

        double totalDays = 0.0;
        for (LeaveApplication leave : approvedLeaves) {
            double days = calculateRequiredDays(leave.getLeaveType(), leave.getStartDate(), leave.getEndDate(), leave.isHalfDay());
            totalDays += days;
            logger.debug("Leave ID {} (Type: {}): {} days (Start: {}, End: {}, Half Day: {})", 
                        leave.getId(), leave.getLeaveType(), days, leave.getStartDate(), leave.getEndDate(), leave.isHalfDay());
        }
        logger.info("Total used days for user {} and leave types {}: {}", user.getId(), leaveTypes, totalDays);
        return totalDays;
    }

    private Map<String, Double> calculateLeaveBalance(User user) {
        // Assistant Directors and Admins do not have leave balances
        if (user.getRole().equals("ASSISTANT_DIRECTOR") || user.getRole().equals("ADMIN")) {
            return new HashMap<>();
        }

        LeaveBalance leaveBalance = user.getLeaveBalance();
        Map<String, Double> balance = new HashMap<>();

        // Recalculate used days for each leave type
        double clUsed = calculateTotalUsedDays(user, List.of("CL", "HALF_DAY_CL"));
        double elUsed = calculateTotalUsedDays(user, List.of("EL", "HALF_DAY_EL"));
        double mlUsed = calculateTotalUsedDays(user, List.of("ML"));
        double plUsed = calculateTotalUsedDays(user, List.of("PL"));

        if (leaveBalance == null) {
            balance.put("CL", 12.0);
            balance.put("EL", 20.0);
            if ("FEMALE".equalsIgnoreCase(user.getGender())) {
                balance.put("ML", 182.0);
            } else {
                balance.put("PL", 15.0);
            }
        } else {
            leaveBalance.setCasualLeaveUsed(clUsed);
            leaveBalance.setCasualLeaveRemaining(12.0 - clUsed);
            leaveBalance.setEarnedLeaveUsed(elUsed);
            leaveBalance.setEarnedLeaveRemaining(20.0 - elUsed);
            if ("FEMALE".equalsIgnoreCase(user.getGender())) {
                leaveBalance.setMaternityLeaveUsed(mlUsed);
                leaveBalance.setMaternityLeaveRemaining(182.0 - mlUsed);
            } else {
                leaveBalance.setPaternityLeaveUsed(plUsed);
                leaveBalance.setPaternityLeaveRemaining(15.0 - plUsed);
            }
            user.setLeaveBalance(leaveBalance);
            userRepository.save(user);

            balance.put("CL", leaveBalance.getCasualLeaveRemaining());
            balance.put("EL", leaveBalance.getEarnedLeaveRemaining());
            if ("FEMALE".equalsIgnoreCase(user.getGender())) {
                balance.put("ML", leaveBalance.getMaternityLeaveRemaining());
            } else {
                balance.put("PL", leaveBalance.getPaternityLeaveRemaining());
            }
        }

        // Calculate LWP balance for the current year (2025)
        LocalDate startOfYear = LocalDate.of(2025, 1, 1);
        LocalDate endOfYear = LocalDate.of(2025, 12, 31);
        List<LeaveApplication> lwpApplications = leaveApplicationRepository.findByUserAndLeaveTypeInAndStartDateBetween(
                user, List.of("LWP", "HALF_DAY_LWP"), startOfYear, endOfYear);

        double totalLwpUsed = lwpApplications.stream()
                .filter(app -> app.getStatus().equals("APPROVED"))
                .mapToDouble(app -> calculateRequiredDays(app.getLeaveType(), app.getStartDate(), app.getEndDate(), app.isHalfDay()))
                .sum();

        balance.put("LWP", Math.max(0, LWP_ANNUAL_LIMIT - totalLwpUsed));
        return balance;
    }

    private double calculateRequiredDays(String leaveType, LocalDate startDate, LocalDate endDate, boolean isHalfDay) {
        // Handle half-day leaves
        if (isHalfDay) {
            logger.debug("Half-day leave ({}): Counting 0.5 days on {}", leaveType, startDate);
            return 0.5;
        }

        // For maternity and paternity leaves, return fixed durations
        if (leaveType.equals("ML")) {
            logger.debug("Maternity leave: Fixed 182 days from {}", startDate);
            return 182.0;
        }
        if (leaveType.equals("PL")) {
            logger.debug("Paternity leave: Fixed 15 days from {}", startDate);
            return 15.0;
        }

        // For other full-day leaves, calculate days based on leave type
        LocalDate currentDate = startDate;
        double totalDays = 0.0;

        // For EL, count all days; for CL and LWP, exclude non-working days
        boolean countHolidays = leaveType.equals("EL");

        while (!currentDate.isAfter(endDate)) {
            if (countHolidays || !isNonWorkingDay(currentDate)) {
                totalDays += 1.0;
                logger.debug("Counting day for {}: {} (Day of week: {})", leaveType, currentDate, currentDate.getDayOfWeek());
            } else {
                logger.debug("Skipping non-working day for {}: {} (Day of week: {})", leaveType, currentDate, currentDate.getDayOfWeek());
            }
            currentDate = currentDate.plusDays(1);
        }

        logger.debug("Calculated {} days for leave type {} from {} to {}", totalDays, leaveType, startDate, endDate);
        return totalDays;
    }

    private boolean isNonWorkingDay(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        if (dayOfWeek == DayOfWeek.SUNDAY) {
            return true;
        }
        if (dayOfWeek == DayOfWeek.SATURDAY) {
            int weekOfMonth = (date.getDayOfMonth() - 1) / 7 + 1;
            return weekOfMonth == 2 || weekOfMonth == 4;
        }
        return false;
    }

    @Transactional
    public void approveLeave(Long leaveId) {
        logger.info("Approving leave application with ID: {}", leaveId);
        LeaveApplication leave = leaveApplicationRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave application not found"));
        User currentUser = userService.getCurrentUser();

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

        leave.setStatus("APPROVED");
        leaveApplicationRepository.save(leave);

        // Skip balance updates for Assistant Directors
        User user = leave.getUser();
        if (user.getRole().equals("ASSISTANT_DIRECTOR")) {
            logger.info("Leave approved for Assistant Director {}. No balance updates needed.", user.getId());
            return;
        }

        // Recalculate balance after approval
        LeaveBalance leaveBalance = user.getLeaveBalance();
        if (leaveBalance == null) {
            leaveBalance = new LeaveBalance();
            leaveBalance.setCasualLeaveRemaining(12.0);
            leaveBalance.setCasualLeaveUsed(0.0);
            leaveBalance.setEarnedLeaveRemaining(20.0);
            leaveBalance.setEarnedLeaveUsed(0.0);
            if ("FEMALE".equalsIgnoreCase(user.getGender())) {
                leaveBalance.setMaternityLeaveRemaining(182.0);
                leaveBalance.setMaternityLeaveUsed(0.0);
            } else {
                leaveBalance.setPaternityLeaveRemaining(15.0);
                leaveBalance.setPaternityLeaveUsed(0.0);
            }
            user.setLeaveBalance(leaveBalance);
        }

        // Recalculate total used days for all leave types
        double clUsed = calculateTotalUsedDays(user, List.of("CL", "HALF_DAY_CL"));
        double elUsed = calculateTotalUsedDays(user, List.of("EL", "HALF_DAY_EL"));
        double mlUsed = calculateTotalUsedDays(user, List.of("ML"));
        double plUsed = calculateTotalUsedDays(user, List.of("PL"));

        // Update leave balance
        leaveBalance.setCasualLeaveUsed(clUsed);
        leaveBalance.setCasualLeaveRemaining(12.0 - clUsed);
        leaveBalance.setEarnedLeaveUsed(elUsed);
        leaveBalance.setEarnedLeaveRemaining(20.0 - elUsed);
        if ("FEMALE".equalsIgnoreCase(user.getGender())) {
            leaveBalance.setMaternityLeaveUsed(mlUsed);
            leaveBalance.setMaternityLeaveRemaining(182.0 - mlUsed);
        } else {
            leaveBalance.setPaternityLeaveUsed(plUsed);
            leaveBalance.setPaternityLeaveRemaining(15.0 - plUsed);
        }

        // Update user entity for LWP fields
        LocalDate startOfYear = LocalDate.of(2025, 1, 1);
        LocalDate endOfYear = LocalDate.of(2025, 12, 31);
        List<LeaveApplication> lwpApplications = leaveApplicationRepository.findByUserAndLeaveTypeInAndStartDateBetween(
                user, List.of("LWP", "HALF_DAY_LWP"), startOfYear, endOfYear);
        double totalLwpUsed = lwpApplications.stream()
                .filter(app -> app.getStatus().equals("APPROVED"))
                .mapToDouble(app -> calculateRequiredDays(app.getLeaveType(), app.getStartDate(), app.getEndDate(), app.isHalfDay()))
                .sum();

        // Update user entity with LWP usage
        user.setLeaveWithoutPayment(lwpApplications.stream()
                .filter(app -> app.getLeaveType().equals("LWP") && app.getStatus().equals("APPROVED"))
                .mapToDouble(app -> calculateRequiredDays(app.getLeaveType(), app.getStartDate(), app.getEndDate(), app.isHalfDay()))
                .sum());
        user.setHalfDayLwp(lwpApplications.stream()
                .filter(app -> app.getLeaveType().equals("HALF_DAY_LWP") && app.getStatus().equals("APPROVED"))
                .mapToDouble(app -> calculateRequiredDays(app.getLeaveType(), app.getStartDate(), app.getEndDate(), app.isHalfDay()))
                .sum());

        // Set remaining leaves for this leave application
        Map<String, Double> updatedBalance = calculateLeaveBalance(user);
        String effectiveLeaveType = leave.getLeaveType();
        if (leave.getLeaveType().equals("HALF_DAY_CL")) {
            effectiveLeaveType = "CL";
        } else if (leave.getLeaveType().equals("HALF_DAY_EL")) {
            effectiveLeaveType = "EL";
        } else if (leave.getLeaveType().equals("HALF_DAY_LWP")) {
            effectiveLeaveType = "LWP";
        }
        leave.setRemainingLeaves(updatedBalance.getOrDefault(effectiveLeaveType, 0.0));
        leaveApplicationRepository.save(leave);

        userRepository.save(user);

        // Log the balances based on gender
        double leaveDays = calculateRequiredDays(leave.getLeaveType(), leave.getStartDate(), leave.getEndDate(), leave.isHalfDay());
        if ("FEMALE".equalsIgnoreCase(user.getGender())) {
            logger.info("Leave approved for user: {}. Leave ID: {}, Type: {}, Days: {}", 
                        user.getId(), leaveId, leave.getLeaveType(), leaveDays);
            logger.info("Updated balances - CL: used {}, remaining {}; EL: used {}, remaining {}; ML: used {}, remaining {}; LWP: used {}, remaining {}", 
                        clUsed, leaveBalance.getCasualLeaveRemaining(), 
                        elUsed, leaveBalance.getEarnedLeaveRemaining(),
                        mlUsed, leaveBalance.getMaternityLeaveRemaining(),
                        totalLwpUsed, updatedBalance.get("LWP"));
        } else {
            logger.info("Leave approved for user: {}. Leave ID: {}, Type: {}, Days: {}", 
                        user.getId(), leaveId, leave.getLeaveType(), leaveDays);
            logger.info("Updated balances - CL: used {}, remaining {}; EL: used {}, remaining {}; PL: used {}, remaining {}; LWP: used {}, remaining {}", 
                        clUsed, leaveBalance.getCasualLeaveRemaining(), 
                        elUsed, leaveBalance.getEarnedLeaveRemaining(),
                        plUsed, leaveBalance.getPaternityLeaveRemaining(),
                        totalLwpUsed, updatedBalance.get("LWP"));
        }
    }

    @Transactional
    public void rejectLeave(Long leaveId) {
        logger.info("Rejecting leave application with ID: {}", leaveId);
        LeaveApplication leave = leaveApplicationRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave application not found"));
        User currentUser = userService.getCurrentUser();

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