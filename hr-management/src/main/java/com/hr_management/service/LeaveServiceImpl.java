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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LeaveServiceImpl implements LeaveService {

    private static final Logger logger = LoggerFactory.getLogger(LeaveServiceImpl.class);

    @Autowired
    private LeaveApplicationRepository leaveApplicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private HolidayService holidayService;

    private static final double LWP_ANNUAL_LIMIT = 300.0;
    private static final double EL_FIRST_HALF = 10.0;
    private static final double EL_SECOND_HALF = 10.0;
    private static final double EL_TOTAL_ANNUAL = EL_FIRST_HALF + EL_SECOND_HALF;
    private static final double CL_TOTAL = 12.0;

    @Override
    @Transactional
    public LeaveApplication applyLeave(LeaveApplication application) {
        logger.info("Applying leave for user: {}, type: {}", userService.getCurrentUser().getId(), application.getLeaveType());
        User user = userService.getCurrentUser();

        if (user.getRole().equals("ADMIN")) {
            logger.warn("Admin {} attempted to apply for leave", user.getId());
            throw new RuntimeException("As the Director, you cannot apply for leaves.");
        }

        application.setUser(user);
        application.setStatus("PENDING");
        application.setAppliedOn(LocalDate.now());

        LocalDate today = LocalDate.now();
        LocalDate earliestAllowedDate = today.minusDays(6);
        if (application.getLeaveType().equals("CL") || application.getLeaveType().equals("HALF_DAY_CL")) {
            if (application.getStartDate().isBefore(earliestAllowedDate)) {
                logger.warn("Attempted to apply CL with start date {} before allowed period (from {}) for user: {}",
                        application.getStartDate(), earliestAllowedDate, user.getId());
                throw new RuntimeException("Casual leave can only be applied for dates within the last 6 days, including today");
            }
        } else {
            if (application.getStartDate().isBefore(today)) {
                logger.warn("Attempted to apply non-CL leave with past start date: {} for user: {}", application.getStartDate(), user.getId());
                throw new RuntimeException("Start date cannot be in the past for non-casual leave types");
            }
        }

        if (application.getLeaveType().equals("ML")) {
            if (!"FEMALE".equalsIgnoreCase(user.getGender())) {
                logger.warn("User {} (gender: {}) attempted to apply for maternity leave", user.getId(), user.getGender());
                throw new RuntimeException("Maternity leave is only available for female employees");
            }
            application.setEndDate(application.getStartDate().plusDays(181)); // 182 days inclusive
            double requiredDays = calculateRequiredDays("ML", application.getStartDate(), application.getEndDate(), false);
            if (requiredDays != 182.0) {
                logger.error("ML duration mismatch for user: {}, calculated: {}, expected: 182", user.getId(), requiredDays);
                throw new RuntimeException("Maternity leave must be exactly 182 days");
            }
        } else if (application.getLeaveType().equals("PL")) {
            if (!"MALE".equalsIgnoreCase(user.getGender())) {
                logger.warn("User {} (gender: {}) attempted to apply for paternity leave", user.getId(), user.getGender());
                throw new RuntimeException("Paternity leave is only available for male employees");
            }
            application.setEndDate(application.getStartDate().plusDays(14)); // 15 days inclusive
            double requiredDays = calculateRequiredDays("PL", application.getStartDate(), application.getEndDate(), false);
            if (requiredDays != 15.0) {
                logger.error("PL duration mismatch for user: {}, calculated: {}, expected: 15", user.getId(), requiredDays);
                throw new RuntimeException("Paternity leave must be exactly 15 days");
            }
        }

        User approver = user.getReportingTo();
        if (approver == null) {
            logger.error("No reporting person found for user: {}. Role: {}", user.getId(), user.getRole());
            throw new RuntimeException("No reporting person available to approve this leave. Please contact HR.");
        }

        application.setApproverId(approver.getId());

        LeaveBalance leaveBalance = initializeLeaveBalance(user);

        if (application.getLeaveType().startsWith("HALF_DAY")) {
            application.setEndDate(application.getStartDate());
            application.setHalfDay(true);
        }

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
            logger.warn("User {} has overlapping leave applications: {}", user.getId(), errorMessage);
            throw new RuntimeException(errorMessage.toString());
        }

        if (application.getLeaveType().startsWith("HALF_DAY")) {
            LocalDate startDate = application.getStartDate();
            if (holidayService.isHoliday(startDate)) {
                logger.warn("User {} attempted to apply half-day leave on a holiday: {}", user.getId(), startDate);
                throw new RuntimeException("Half-day leave cannot be applied on a holiday.");
            }
            List<LeaveApplication> existingLeaves = leaveApplicationRepository.findByUserAndStartDate(user, startDate);
            boolean hasHalfDayLeave = existingLeaves.stream()
                    .anyMatch(leave -> leave.getLeaveType().startsWith("HALF_DAY") &&
                            (leave.getStatus().equals("PENDING") || leave.getStatus().equals("APPROVED")));
            if (hasHalfDayLeave) {
                logger.warn("User {} already has a half-day leave on date: {}", user.getId(), startDate);
                throw new RuntimeException("You already have a half-day leave application on " + startDate);
            }
        }

        Map<String, Double> balance = calculateLeaveBalance(user);
        String effectiveLeaveType = application.getLeaveType();
        if (application.getLeaveType().equals("HALF_DAY_CL")) effectiveLeaveType = "CL";
        else if (application.getLeaveType().equals("HALF_DAY_EL")) effectiveLeaveType = "EL";
        else if (application.getLeaveType().equals("HALF_DAY_LWP")) effectiveLeaveType = "LWP";

        double requiredDays = calculateRequiredDays(application.getLeaveType(), application.getStartDate(),
                application.getEndDate(), application.isHalfDay());
        logger.info("Calculated required days for leave application: {}, type: {}: {}",
                application.getId(), application.getLeaveType(), requiredDays);

        if (effectiveLeaveType.equals("CL")) {
            validateClApplication(user, application.getStartDate(), application.getEndDate(), requiredDays, balance.get("CL"));
        }

        if (effectiveLeaveType.equals("EL")) {
            validateElApplication(user, application.getStartDate(), requiredDays, balance.get("EL"));
        }

        double remainingLeaves = balance.getOrDefault(effectiveLeaveType, 0.0);
        if (!effectiveLeaveType.equals("LWP") && remainingLeaves < requiredDays) {
            logger.warn("Insufficient leave balance for user: {}, type: {}, remaining: {}, required: {}",
                    user.getId(), application.getLeaveType(), remainingLeaves, requiredDays);
            throw new RuntimeException("Insufficient " + effectiveLeaveType + " balance. Requested: " + requiredDays);
        }

        if (application.getLeaveType().equals("ML")) {
            double totalMaternityLeaveUsed = leaveBalance.getMaternityLeaveUsed() + requiredDays;
            if (totalMaternityLeaveUsed > 182.0) {
                logger.warn("Total maternity leave exceeds 182 days for user: {}", user.getId());
                throw new RuntimeException("Total maternity leave cannot exceed 182 days. Used: " + leaveBalance.getMaternityLeaveUsed());
            }
        } else if (application.getLeaveType().equals("PL")) {
            double totalPaternityLeaveUsed = leaveBalance.getPaternityLeaveUsed() + requiredDays;
            if (totalPaternityLeaveUsed > 15.0) {
                logger.warn("Total paternity leave exceeds 15 days for user: {}", user.getId());
                throw new RuntimeException("Total paternity leave cannot exceed 15 days. Used: " + leaveBalance.getPaternityLeaveUsed());
            }
        }

        application.setRemainingLeaves(remainingLeaves);
        LeaveApplication savedApplication = leaveApplicationRepository.save(application);
        logger.info("Leave application saved: ID {}", savedApplication.getId());
        return savedApplication;
    }

    @Override
    @Transactional
    public void approveLeave(Long leaveId) {
        logger.info("Approving leave application with ID: {}", leaveId);
        LeaveApplication leave = leaveApplicationRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave application not found"));
        User currentUser = userService.getCurrentUser();

        User approver = leave.getUser().getReportingTo();
        if (approver == null || !approver.getId().equals(currentUser.getId())) {
            logger.warn("User {} attempted to approve leave {} they are not authorized for", currentUser.getId(), leaveId);
            throw new RuntimeException("You are not authorized to approve this leave");
        }
        if (!leave.getStatus().equals("PENDING")) {
            logger.warn("Leave application {} is already processed with status: {}", leaveId, leave.getStatus());
            throw new RuntimeException("Leave application is already processed");
        }

        leave.setStatus("APPROVED");
        User user = leave.getUser();
        double requiredDays = calculateRequiredDays(leave.getLeaveType(), leave.getStartDate(),
                leave.getEndDate(), leave.isHalfDay());

        LeaveBalance leaveBalance = initializeLeaveBalance(user);
        if (leave.getLeaveType().equals("CL") || leave.getLeaveType().equals("HALF_DAY_CL")) {
            LocalDate currentDate = LocalDate.now();
            if (!leave.getStartDate().isAfter(currentDate)) {
                leaveBalance.setCasualLeaveUsed(leaveBalance.getCasualLeaveUsed() + requiredDays);
            }
            leaveBalance.setCasualLeaveRemaining(calculateAvailableCl(user, currentDate));
        } else if (leave.getLeaveType().equals("EL") || leave.getLeaveType().equals("HALF_DAY_EL")) {
            LocalDate startDate = leave.getStartDate();
            if (startDate.getMonthValue() <= 6) {
                leaveBalance.setEarnedLeaveUsedFirstHalf(leaveBalance.getEarnedLeaveUsedFirstHalf() + requiredDays);
            } else {
                leaveBalance.setEarnedLeaveUsedSecondHalf(leaveBalance.getEarnedLeaveUsedSecondHalf() + requiredDays);
            }
            leaveBalance.setEarnedLeaveRemaining(calculateAvailableEl(user, LocalDate.now()));
        } else if (leave.getLeaveType().equals("ML")) {
            leaveBalance.setMaternityLeaveUsed(leaveBalance.getMaternityLeaveUsed() + requiredDays);
            leaveBalance.setMaternityLeaveRemaining(182.0 - leaveBalance.getMaternityLeaveUsed());
        } else if (leave.getLeaveType().equals("PL")) {
            leaveBalance.setPaternityLeaveUsed(leaveBalance.getPaternityLeaveUsed() + requiredDays);
            leaveBalance.setPaternityLeaveRemaining(15.0 - leaveBalance.getPaternityLeaveUsed());
        } else if (leave.getLeaveType().equals("LWP") || leave.getLeaveType().equals("HALF_DAY_LWP")) {
            user.setLeaveWithoutPayment(user.getLeaveWithoutPayment() + (leave.getLeaveType().equals("LWP") ? requiredDays : 0));
            user.setHalfDayLwp(user.getHalfDayLwp() + (leave.getLeaveType().equals("HALF_DAY_LWP") ? requiredDays : 0));
        }

        Map<String, Double> updatedBalance = calculateLeaveBalance(user);
        String effectiveLeaveType = leave.getLeaveType();
        if (leave.getLeaveType().equals("HALF_DAY_CL")) effectiveLeaveType = "CL";
        else if (leave.getLeaveType().equals("HALF_DAY_EL")) effectiveLeaveType = "EL";
        else if (leave.getLeaveType().equals("HALF_DAY_LWP")) effectiveLeaveType = "LWP";
        leave.setRemainingLeaves(updatedBalance.getOrDefault(effectiveLeaveType, 0.0));

        leaveApplicationRepository.save(leave);
        userRepository.save(user);
        logger.info("Leave approved for user: {}. Leave ID: {}, Type: {}, Days: {}",
                user.getId(), leaveId, leave.getLeaveType(), requiredDays);
    }

    @Override
    @Transactional
    public void rejectLeave(Long leaveId) {
        logger.info("Rejecting leave application with ID: {}", leaveId);
        LeaveApplication leave = leaveApplicationRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave application not found"));
        User currentUser = userService.getCurrentUser();

        User approver = leave.getUser().getReportingTo();
        if (approver == null || !approver.getId().equals(currentUser.getId())) {
            logger.warn("User {} attempted to reject leave {} they are not authorized for", currentUser.getId(), leaveId);
            throw new RuntimeException("You are not authorized to reject this leave");
        }
        leave.setStatus("REJECTED");
        leaveApplicationRepository.save(leave);
        logger.info("Leave rejected for application ID: {}", leaveId);
    }

    @Override
    @Transactional
    public void cancelLeave(Long leaveId) {
        logger.info("Cancelling leave application with ID: {}", leaveId);
        LeaveApplication leave = leaveApplicationRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave application not found"));
        User currentUser = userService.getCurrentUser();

        User approver = leave.getUser().getReportingTo();
        if (approver == null || !approver.getId().equals(currentUser.getId())) {
            logger.warn("User {} attempted to cancel leave {} they are not authorized for", currentUser.getId(), leaveId);
            throw new RuntimeException("You are not authorized to cancel this leave");
        }

        if (!leave.getStatus().equals("APPROVED")) {
            logger.warn("Leave application {} cannot be cancelled as it is not approved, current status: {}", leaveId, leave.getStatus());
            throw new RuntimeException("Only approved leaves can be cancelled");
        }

        LocalDate currentDate = LocalDate.now();
        LocalDate endDate = leave.getEndDate();
        LocalDate cancellationDeadline = endDate.plusDays(15);
        if (currentDate.isAfter(cancellationDeadline)) {
            logger.warn("Leave application {} cannot be cancelled as it is past the 15-day window from end date {}", leaveId, endDate);
            throw new RuntimeException("Leave cannot be cancelled after 15 days from the end date");
        }

        leave.setStatus("CANCELLED");
        User user = leave.getUser();
        LeaveBalance leaveBalance = initializeLeaveBalance(user);
        double requiredDays = calculateRequiredDays(leave.getLeaveType(), leave.getStartDate(),
                leave.getEndDate(), leave.isHalfDay());

        if (leave.getLeaveType().equals("CL") || leave.getLeaveType().equals("HALF_DAY_CL")) {
            leaveBalance.setCasualLeaveUsed(Math.max(0, leaveBalance.getCasualLeaveUsed() - requiredDays));
            leaveBalance.setCasualLeaveRemaining(calculateAvailableCl(user, currentDate));
        } else if (leave.getLeaveType().equals("EL") || leave.getLeaveType().equals("HALF_DAY_EL")) {
            LocalDate startDate = leave.getStartDate();
            if (startDate.getMonthValue() <= 6) {
                leaveBalance.setEarnedLeaveUsedFirstHalf(Math.max(0, leaveBalance.getEarnedLeaveUsedFirstHalf() - requiredDays));
            } else {
                leaveBalance.setEarnedLeaveUsedSecondHalf(Math.max(0, leaveBalance.getEarnedLeaveUsedSecondHalf() - requiredDays));
            }
            leaveBalance.setEarnedLeaveRemaining(calculateAvailableEl(user, currentDate));
        } else if (leave.getLeaveType().equals("ML")) {
            leaveBalance.setMaternityLeaveUsed(Math.max(0, leaveBalance.getMaternityLeaveUsed() - requiredDays));
            leaveBalance.setMaternityLeaveRemaining(182.0 - leaveBalance.getMaternityLeaveUsed());
        } else if (leave.getLeaveType().equals("PL")) {
            leaveBalance.setPaternityLeaveUsed(Math.max(0, leaveBalance.getPaternityLeaveUsed() - requiredDays));
            leaveBalance.setPaternityLeaveRemaining(15.0 - leaveBalance.getPaternityLeaveUsed());
        } else if (leave.getLeaveType().equals("LWP") || leave.getLeaveType().equals("HALF_DAY_LWP")) {
            if (leave.getLeaveType().equals("LWP")) {
                user.setLeaveWithoutPayment(Math.max(0, user.getLeaveWithoutPayment() - requiredDays));
            } else {
                user.setHalfDayLwp(Math.max(0, user.getHalfDayLwp() - requiredDays));
            }
        }

        Map<String, Double> updatedBalance = calculateLeaveBalance(user);
        String effectiveLeaveType = leave.getLeaveType();
        if (leave.getLeaveType().equals("HALF_DAY_CL")) effectiveLeaveType = "CL";
        else if (leave.getLeaveType().equals("HALF_DAY_EL")) effectiveLeaveType = "EL";
        else if (leave.getLeaveType().equals("HALF_DAY_LWP")) effectiveLeaveType = "LWP";
        leave.setRemainingLeaves(updatedBalance.getOrDefault(effectiveLeaveType, 0.0));

        leaveApplicationRepository.save(leave);
        userRepository.save(user);
        logger.info("Leave cancelled for user: {}. Leave ID: {}, Type: {}", user.getId(), leaveId, leave.getLeaveType());
    }

    @Override
    public List<LeaveApplicationDTO> getPendingLeavesForCurrentUser() {
        User currentUser = userService.getCurrentUser();
        List<User> subordinates = currentUser.getSubordinates();
        List<Long> subordinateIds = subordinates.stream().map(User::getId).collect(Collectors.toList());
        List<LeaveApplication> pendingLeaves = leaveApplicationRepository.findByUserIdInAndStatus(subordinateIds, "PENDING");
        return pendingLeaves.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public List<LeaveApplicationDTO> getCancellableLeavesForCurrentUser() {
        logger.info("Fetching cancellable leaves for current user");
        User currentUser = userService.getCurrentUser();
        LocalDate currentDate = LocalDate.now();
        LocalDate cancellationDeadline = currentDate.plusDays(15);
        List<LeaveApplication> cancellableLeaves = leaveApplicationRepository.findCancellableLeavesByApproverId(
                currentUser.getId(), currentDate, cancellationDeadline);
        return cancellableLeaves.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public Map<String, Integer> getLeaveStatsForCurrentUser() {
        User currentUser = userService.getCurrentUser();
        List<User> subordinates = currentUser.getSubordinates();
        List<Long> subordinateIds = subordinates.stream().map(User::getId).collect(Collectors.toList());
        Map<String, Integer> stats = new HashMap<>();
        stats.put("pending", (int) leaveApplicationRepository.countByUserIdInAndStatus(subordinateIds, "PENDING"));
        stats.put("approved", (int) leaveApplicationRepository.countByUserIdInAndStatus(subordinateIds, "APPROVED"));
        stats.put("rejected", (int) leaveApplicationRepository.countByUserIdInAndStatus(subordinateIds, "REJECTED"));
        return stats;
    }

    @Override
    public List<LeaveApplication> getUserLeaves() {
        User user = userService.getCurrentUser();
        return leaveApplicationRepository.findByUser(user);
    }

    @Override
    public Map<String, Object> getLeaveBalance() {
        User user = userService.getCurrentUser();
        logger.info("Fetching leave balance for user: {}, joinDate: {}", user.getId(), user.getJoinDate());

        if (user.getRole().equals("ADMIN")) {
            return new HashMap<>();
        }

        LeaveBalance leaveBalance = initializeLeaveBalance(user);
        LocalDate currentDate = LocalDate.now();
        int currentYear = currentDate.getYear();
        int currentMonth = currentDate.getMonthValue();

        double clUsed = calculateTotalUsedDays(user, List.of("CL", "HALF_DAY_CL"),
                LocalDate.of(currentYear, 1, 1), currentDate, true);
        double x = calculateTotalUsedDays(user, List.of("EL", "HALF_DAY_EL"),
                LocalDate.of(currentYear, 1, 1), LocalDate.of(currentYear, 6, 30), false);
        double y = calculateTotalUsedDays(user, List.of("EL", "HALF_DAY_EL"),
                LocalDate.of(currentYear, 7, 1), LocalDate.of(currentYear, 12, 31), true);
        double mlUsed = calculateTotalUsedDays(user, List.of("ML"),
                LocalDate.of(currentYear, 1, 1), LocalDate.of(currentYear, 12, 31), false);
        double plUsed = calculateTotalUsedDays(user, List.of("PL"),
                LocalDate.of(currentYear, 1, 1), LocalDate.of(currentYear, 12, 31), false);

        logger.info("EL balance for user {}: x (first half used)={}, y (second half used including pending)={}, month={}",
                user.getId(), x, y, currentMonth);

        leaveBalance.setCasualLeaveUsed(clUsed);
        leaveBalance.setCasualLeaveRemaining(calculateAvailableCl(user, currentDate));
        leaveBalance.setEarnedLeaveUsedFirstHalf(x);
        leaveBalance.setEarnedLeaveUsedSecondHalf(y);
        double elRemaining = calculateAvailableEl(user, currentDate);
        leaveBalance.setEarnedLeaveRemaining(elRemaining);
        if ("FEMALE".equalsIgnoreCase(user.getGender())) {
            leaveBalance.setMaternityLeaveUsed(mlUsed);
            leaveBalance.setMaternityLeaveRemaining(182.0 - mlUsed);
        } else {
            leaveBalance.setPaternityLeaveUsed(plUsed);
            leaveBalance.setPaternityLeaveRemaining(15.0 - plUsed);
        }
        userRepository.save(user);

        LocalDate startOfYear = LocalDate.of(currentYear, 1, 1);
        LocalDate endOfYear = LocalDate.of(currentYear, 12, 31);
        List<LeaveApplication> lwpApplications = leaveApplicationRepository.findByUserAndLeaveTypeInAndStartDateBetween(
                user, List.of("LWP", "HALF_DAY_LWP"), startOfYear, endOfYear, false);

        double totalLwpUsed = lwpApplications.stream()
                .filter(app -> app.getStatus().equals("APPROVED"))
                .mapToDouble(app -> calculateRequiredDays(app.getLeaveType(), app.getStartDate(), app.getEndDate(), app.isHalfDay()))
                .sum();
        double remainingLwp = LWP_ANNUAL_LIMIT - totalLwpUsed;

        double carryover = Math.max(0, EL_FIRST_HALF - x - y);

        Map<String, Object> result = new HashMap<>();
        int joinYear = user.getJoinDate().getYear();
        int joinMonth = user.getJoinDate().getMonthValue();
        result.put("casualLeave", Map.of(
                "total", (joinYear == currentYear ? (13 - joinMonth) : CL_TOTAL),
                "used", Math.round(clUsed * 10.0) / 10.0,
                "remaining", Math.round(leaveBalance.getCasualLeaveRemaining() * 10.0) / 10.0
        ));
        result.put("earnedLeave", Map.of(
                "total", EL_TOTAL_ANNUAL,
                "used", Math.round((x + y) * 10.0) / 10.0,
                "remaining", Math.round(elRemaining * 10.0) / 10.0,
                "usedFirstHalf", Math.round(x * 10.0) / 10.0,
                "usedSecondHalf", Math.round(y * 10.0) / 10.0,
                "carryover", Math.round(carryover * 10.0) / 10.0
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
                "remaining", Math.round(remainingLwp * 10.0) / 10.0
        ));

        logger.info("Fetched leave balance for user {}: CL used {}, remaining {}; EL used x={}, y={}, remaining={}, total={}; LWP used {}, remaining {}",
                user.getId(), clUsed, leaveBalance.getCasualLeaveRemaining(),
                x, y, elRemaining, EL_TOTAL_ANNUAL, totalLwpUsed, remainingLwp);
        return result;
    }

    @Override
    public Map<String, Double> getAvailableClForMonth(int year, int month) {
        User user = userService.getCurrentUser();
        double availableCl = calculateAvailableClUpToMonth(user, month, year);
        return Map.of("availableCl", availableCl);
    }

    private LeaveBalance initializeLeaveBalance(User user) {
        LeaveBalance leaveBalance = user.getLeaveBalance();
        if (leaveBalance == null) {
            leaveBalance = new LeaveBalance();
            user.setLeaveBalance(leaveBalance);
        }
        LocalDate joinDate = user.getJoinDate();
        if (joinDate == null) {
            logger.error("Join date is null for user: {}", user.getId());
            throw new RuntimeException("User join date is not set. Please contact HR.");
        }
        int currentYear = LocalDate.now().getYear();
        int joinYear = joinDate.getYear();
        int joinMonth = joinDate.getMonthValue();

        if (leaveBalance.getLastInitializedYear() == null || leaveBalance.getLastInitializedYear() != currentYear) {
            leaveBalance.setCasualLeaveUsed(0.0);
            leaveBalance.setMonthlyClAccrual(new HashMap<>());
            leaveBalance.setLastInitializedYear(currentYear);
        }

        Map<Integer, Double> monthlyClAccrual = leaveBalance.getMonthlyClAccrual();
        int startMonth = (joinYear == currentYear) ? joinMonth : 1;
        for (int month = startMonth; month <= 12; month++) {
            monthlyClAccrual.putIfAbsent(month, 1.0);
        }
        leaveBalance.setCasualLeaveRemaining(calculateAvailableCl(user, LocalDate.now()));

        leaveBalance.setEarnedLeaveUsedFirstHalf(0.0);
        leaveBalance.setEarnedLeaveUsedSecondHalf(0.0);
        leaveBalance.setEarnedLeaveRemaining(calculateAvailableEl(user, LocalDate.now()));

        if ("FEMALE".equalsIgnoreCase(user.getGender())) {
            leaveBalance.setMaternityLeaveRemaining(182.0);
            leaveBalance.setMaternityLeaveUsed(0.0);
        } else {
            leaveBalance.setPaternityLeaveRemaining(15.0);
            leaveBalance.setPaternityLeaveUsed(0.0);
        }
        userRepository.save(user);
        logger.info("Initialized leave balance for user {}: CL remaining={}, EL remaining={}",
                user.getId(), leaveBalance.getCasualLeaveRemaining(), leaveBalance.getEarnedLeaveRemaining());
        return leaveBalance;
    }

    private double calculateAvailableCl(User user, LocalDate date) {
        LocalDate joinDate = user.getJoinDate();
        if (joinDate == null) {
            logger.error("Join date is null for user: {}", user.getId());
            throw new RuntimeException("User join date is not set. Please contact HR.");
        }
        int currentYear = date.getYear();
        int joinYear = joinDate.getYear();
        int currentMonth = date.getMonthValue();
        int joinMonth = joinDate.getMonthValue();

        if (currentYear < joinYear) return 0.0;

        LeaveBalance leaveBalance = user.getLeaveBalance();
        Map<Integer, Double> monthlyClAccrual = leaveBalance.getMonthlyClAccrual();

        double totalClAccrued = 0.0;
        int endMonth = (joinYear == currentYear) ? Math.min(12, currentMonth) : currentMonth;
        for (int month = (joinYear == currentYear) ? joinMonth : 1; month <= endMonth; month++) {
            totalClAccrued += monthlyClAccrual.getOrDefault(month, 0.0);
        }

        double clUsed = calculateTotalUsedDays(user, List.of("CL", "HALF_DAY_CL"),
                LocalDate.of(currentYear, 1, 1), LocalDate.of(currentYear, 12, 31), true);
        double availableCl = Math.max(0, totalClAccrued - clUsed);
        logger.info("Calculated available CL for user {} on {}: accrued {}, used (including pending) {}, available {}",
                user.getId(), date, totalClAccrued, clUsed, availableCl);
        return availableCl;
    }

    private double calculateAvailableClUpToMonth(User user, int targetMonth, int targetYear) {
        LocalDate joinDate = user.getJoinDate();
        if (joinDate == null) {
            logger.error("Join date is null for user: {}", user.getId());
            throw new RuntimeException("User join date is not set. Please contact HR.");
        }
        int joinYear = joinDate.getYear();
        int joinMonth = joinDate.getMonthValue();

        if (targetYear < joinYear || (targetYear == joinYear && targetMonth < joinMonth)) return 0.0;

        LeaveBalance leaveBalance = user.getLeaveBalance();
        Map<Integer, Double> monthlyClAccrual = leaveBalance.getMonthlyClAccrual();

        double totalClAccrued = 0.0;
        int endMonth = (joinYear == targetYear) ? Math.min(targetMonth, 12) : targetMonth;
        for (int month = (joinYear == targetYear) ? joinMonth : 1; month <= endMonth; month++) {
            totalClAccrued += monthlyClAccrual.getOrDefault(month, 0.0);
        }

        double clUsed = calculateTotalUsedDays(user, List.of("CL", "HALF_DAY_CL"),
                LocalDate.of(targetYear, 1, 1), LocalDate.of(targetYear, 12, 31), true);
        double availableCl = Math.max(0, totalClAccrued - clUsed);
        logger.info("Calculated available CL for user {} up to {}-{}: accrued {}, used (including pending) {}, available {}",
                user.getId(), targetMonth, targetYear, totalClAccrued, clUsed, availableCl);
        return availableCl;
    }

    private double calculateAvailableEl(User user, LocalDate date) {
        LocalDate joinDate = user.getJoinDate();
        if (joinDate == null) {
            logger.error("Join date is null for user: {}", user.getId());
            throw new RuntimeException("User join date is not set. Please contact HR.");
        }
        int currentYear = date.getYear();
        int joinYear = joinDate.getYear();
        int currentMonth = date.getMonthValue();

        logger.info("Calculating EL for user: {}, joinYear: {}, currentYear: {}, currentMonth: {}",
                user.getId(), joinYear, currentYear, currentMonth);

        LeaveBalance leaveBalance = user.getLeaveBalance();
        if (leaveBalance == null) {
            leaveBalance = initializeLeaveBalance(user);
        }

        double x = calculateTotalUsedDays(user, List.of("EL", "HALF_DAY_EL"),
                LocalDate.of(currentYear, 1, 1), LocalDate.of(currentYear, 6, 30), false);
        double y = calculateTotalUsedDays(user, List.of("EL", "HALF_DAY_EL"),
                LocalDate.of(currentYear, 7, 1), LocalDate.of(currentYear, 12, 31), true);
        double carryover = Math.max(0, EL_FIRST_HALF - x - y);

        double available;
        if (currentMonth <= 6) {
            available = Math.max(0, EL_TOTAL_ANNUAL - x - y);
        } else {
            available = Math.max(0, (EL_SECOND_HALF + carryover) - y);
        }

        logger.info("EL calculation for user {}: x (first half used)={}, y (second half used including pending)={}, carryover={}, available={}",
                user.getId(), x, y, carryover, available);

        return available;
    }

    private void validateClApplication(User user, LocalDate startDate, LocalDate endDate, double requiredDays, double availableCl) {
        LocalDate joinDate = user.getJoinDate();
        if (joinDate == null) {
            logger.error("Join date is null for user: {}", user.getId());
            throw new RuntimeException("User join date is not set. Please contact HR.");
        }
        int currentYear = LocalDate.now().getYear();
        int currentMonth = LocalDate.now().getMonthValue();
        int applicationYear = startDate.getYear();
        int applicationMonth = startDate.getMonthValue();
        int joinYear = joinDate.getYear();
        int joinMonth = joinDate.getMonthValue();

        if (applicationYear > currentYear) {
            logger.warn("User {} attempted to apply CL for future year {}", user.getId(), applicationYear);
            throw new RuntimeException("Advance CL application is only allowed within the current year");
        }

        if (joinYear == currentYear && applicationMonth < joinMonth) {
            logger.warn("User {} attempted to apply CL for month {} before join month {}", user.getId(), applicationMonth, joinMonth);
            throw new RuntimeException("Cannot apply CL for a month before joining date");
        }

        double clUsedInMonth = calculateTotalUsedDays(user, List.of("CL", "HALF_DAY_CL"),
                LocalDate.of(applicationYear, applicationMonth, 1),
                LocalDate.of(applicationYear, applicationMonth, 1).plusMonths(1).minusDays(1), true);

        if (clUsedInMonth + requiredDays > 1.0) {
            logger.warn("User {} exceeded monthly CL limit for month {}: used {}, requested {}", user.getId(), applicationMonth, clUsedInMonth, requiredDays);
            throw new RuntimeException("Cannot apply more than 1 CL in month " + startDate.getMonth() + ". Requested: " + requiredDays + ", Already used: " + clUsedInMonth);
        }

        List<LeaveApplication> existingLeaves = leaveApplicationRepository.findByUserAndLeaveTypeInAndStartDateBetween(
                user, List.of("CL", "HALF_DAY_CL"),
                LocalDate.of(currentYear, 1, 1), LocalDate.of(currentYear, 12, 31), true);

        LocalDate latestClDate = existingLeaves.stream()
                .filter(leave -> (leave.getStatus().equals("PENDING") || leave.getStatus().equals("APPROVED")) && leave.getStartDate().isAfter(LocalDate.now()))
                .map(LeaveApplication::getStartDate)
                .max(LocalDate::compareTo)
                .orElse(null);

        if (latestClDate != null && startDate.isBefore(latestClDate) && startDate.getMonthValue() != latestClDate.getMonthValue()) {
            logger.warn("User {} attempted to apply CL before latest advance CL date {}", user.getId(), latestClDate);
            throw new RuntimeException("Cannot apply CL before the latest advance CL application date: " + latestClDate + " unless applying for the same month");
        }

        double availableForApplicationMonth = calculateAvailableClUpToMonth(user, applicationMonth, applicationYear);
        if (availableForApplicationMonth < requiredDays) {
            logger.warn("User {} insufficient CL balance for month {}: requested {}, available {}", user.getId(), applicationMonth, requiredDays, availableForApplicationMonth);
            throw new RuntimeException("Insufficient CL balance for month " + startDate.getMonth() +
                    ". Requested: " + requiredDays + ", Available: " + availableForApplicationMonth);
        }
    }

    private void validateElApplication(User user, LocalDate startDate, double requiredDays, double availableEl) {
        int currentMonth = LocalDate.now().getMonthValue();
        int applicationMonth = startDate.getMonthValue();
        LocalDate joinDate = user.getJoinDate();
        if (joinDate == null) {
            logger.error("Join date is null for user: {}", user.getId());
            throw new RuntimeException("User join date is not set. Please contact HR.");
        }
        int joinYear = joinDate.getYear();
        int currentYear = LocalDate.now().getYear();

        if (startDate.getYear() > currentYear) {
            logger.warn("User {} attempted to apply EL for future year {}", user.getId(), startDate.getYear());
            throw new RuntimeException("Advance EL application is only allowed within the current year");
        }

        double x = calculateTotalUsedDays(user, List.of("EL", "HALF_DAY_EL"),
                LocalDate.of(currentYear, 1, 1), LocalDate.of(currentYear, 6, 30), false);
        double y = calculateTotalUsedDays(user, List.of("EL", "HALF_DAY_EL"),
                LocalDate.of(currentYear, 7, 1), LocalDate.of(currentYear, 12, 31), true);
        double carryover = Math.max(0, EL_FIRST_HALF - x - y);
        double zEligible = EL_SECOND_HALF + carryover;

        if (applicationMonth <= 6) {
            if (currentMonth > 6) {
                logger.warn("User {} attempted to apply EL for first half (month {}) in second half (month {})", user.getId(), applicationMonth, currentMonth);
                throw new RuntimeException("Cannot apply EL for the first half (Jan-Jun) when current month is in the second half (Jul-Dec)");
            }
            if (x + requiredDays > EL_FIRST_HALF - y) {
                logger.warn("User {} exceeded first half EL limit: used x={}, pending advance y={}, requested {}, available {}", user.getId(), x, y, requiredDays, EL_FIRST_HALF - y);
                throw new RuntimeException("Cannot apply more than " + (EL_FIRST_HALF - y) + " EL days in the first half due to advance applications. Requested: " + requiredDays + ", Used: " + x);
            }
        } else {
            if (currentMonth <= 6) {
                double totalEligible = EL_TOTAL_ANNUAL;
                if (x + y + requiredDays > totalEligible) {
                    logger.warn("User {} exceeded annual EL limit for advance second half: used x={}, y={}, requested {}, totalEligible={}", user.getId(), x, y, requiredDays, totalEligible);
                    throw new RuntimeException("Cannot apply more than " + (totalEligible - x - y) + " EL days in advance for the second half. Requested: " + requiredDays + ", Available: " + (totalEligible - x - y));
                }
            } else {
                if (y + requiredDays > zEligible) {
                    logger.warn("User {} exceeded second half EL limit: used y={}, requested {}, zEligible={}", user.getId(), y, requiredDays, zEligible);
                    throw new RuntimeException("Cannot apply more than " + zEligible + " EL days in the second half. Requested: " + requiredDays + ", Used: " + y);
                }
                if (x + y + requiredDays > EL_TOTAL_ANNUAL) {
                    logger.warn("User {} exceeded annual EL limit: used x={}, y={}, requested {}, limit {}", user.getId(), x, y, requiredDays, EL_TOTAL_ANNUAL);
                    throw new RuntimeException("Total EL usage cannot exceed " + EL_TOTAL_ANNUAL + " days annually. Requested: " + requiredDays + ", Total used: " + (x + y));
                }
            }
        }
    }

    private double calculateTotalUsedDays(User user, List<String> leaveTypes) {
        int currentYear = LocalDate.now().getYear();
        return calculateTotalUsedDays(user, leaveTypes,
                LocalDate.of(currentYear, 1, 1), LocalDate.of(currentYear, 12, 31), false);
    }

    private double calculateTotalUsedDays(User user, List<String> leaveTypes, LocalDate start, LocalDate end) {
        return calculateTotalUsedDays(user, leaveTypes, start, end, false);
    }

    private double calculateTotalUsedDays(User user, List<String> leaveTypes, LocalDate start, LocalDate end, boolean includePending) {
        List<LeaveApplication> leaves = leaveApplicationRepository.findByUserAndLeaveTypeInAndStartDateBetween(
                user, leaveTypes, start, end, includePending);
        double totalDays = leaves.stream()
                .filter(leave -> leave.getStatus().equals("APPROVED") || (includePending && leave.getStatus().equals("PENDING")))
                .mapToDouble(leave -> calculateRequiredDays(leave.getLeaveType(), leave.getStartDate(), leave.getEndDate(), leave.isHalfDay()))
                .sum();

        logger.info("Total used days for user: {}, leaveTypes: {}, period {} to {}, includePending: {}, total: {}",
                user.getId(), leaveTypes, start, end, includePending, totalDays);
        return totalDays;
    }

    private double calculateRequiredDays(String leaveType, LocalDate startDate, LocalDate endDate, boolean isHalfDay) {
        logger.info("Calculating required days for leaveType: {}, startDate: {}, endDate: {}, isHalfDay: {}",
                leaveType, startDate, endDate, isHalfDay);

        if (isHalfDay) {
            if (holidayService.isHoliday(startDate)) {
                logger.warn("Half-day leave requested on holiday: {}", startDate);
                return 0.0;
            }
            return 0.5;
        }

        if (startDate == null || endDate == null) {
            logger.warn("Invalid dates provided: startDate={}, endDate={}", startDate, endDate);
            return 0.0;
        }

        if (leaveType.equals("EL") || leaveType.equals("ML") || leaveType.equals("PL")) {
            long totalDays = startDate.datesUntil(endDate.plusDays(1)).count();
            logger.info("{} leave: counted {} days including holidays (sandwich rule)", leaveType, totalDays);
            return (double) totalDays;
        }

        double totalDays = 0.0;
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            if (!holidayService.isHoliday(currentDate)) {
                totalDays += 1.0;
            }
            currentDate = currentDate.plusDays(1);
        }
        logger.info("Non-EL/ML/PL leave ({}): counted {} days, excluding holidays", leaveType, totalDays);
        return totalDays;
    }

    private Map<String, Double> calculateLeaveBalance(User user) {
        Map<String, Double> balance = new HashMap<>();
        LocalDate currentDate = LocalDate.now();
        balance.put("CL", calculateAvailableCl(user, currentDate));
        balance.put("EL", calculateAvailableEl(user, currentDate));
        balance.put("LWP", LWP_ANNUAL_LIMIT - calculateTotalUsedDays(user, List.of("LWP", "HALF_DAY_LWP"),
                LocalDate.of(currentDate.getYear(), 1, 1), currentDate, false));
        if ("FEMALE".equalsIgnoreCase(user.getGender())) {
            balance.put("ML", 182.0 - calculateTotalUsedDays(user, List.of("ML"), LocalDate.of(currentDate.getYear(), 1, 1), currentDate, false));
        } else {
            balance.put("PL", 15.0 - calculateTotalUsedDays(user, List.of("PL"), LocalDate.of(currentDate.getYear(), 1, 1), currentDate, false));
        }
        return balance;
    }

    private LeaveApplicationDTO convertToDTO(LeaveApplication leave) {
        LeaveApplicationDTO dto = new LeaveApplicationDTO();
        dto.setId(leave.getId());
        dto.setLeaveType(leave.getLeaveType());
        dto.setStartDate(leave.getStartDate());
        dto.setEndDate(leave.getEndDate());
        dto.setReason(leave.getReason());
        dto.setStatus(leave.getStatus());
        dto.setAppliedOn(leave.getAppliedOn());
        dto.setRemainingLeaves(leave.getRemainingLeaves());
        dto.setUserName(leave.getUser().getFullName());
        dto.setHalfDay(leave.isHalfDay());
        dto.setDepartment(leave.getUser().getDepartment());
        return dto;
    }
}