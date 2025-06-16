package com.hr_management.service;

import com.hr_management.Entity.LeaveApplication;
import com.hr_management.Entity.User;
import com.hr_management.Entity.LeaveBalance;
import com.hr_management.Repository.LeaveApplicationRepository;
import com.hr_management.Repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import java.util.List;
import org.mockito.MockedStatic;

class LeaveServiceTest {

    @InjectMocks
    private LeaveService leaveService;

    @Mock
    private LeaveApplicationRepository leaveApplicationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    private User user;
    private LeaveBalance leaveBalance;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        user = new User();
        user.setId(1L);
        user.setRole("EMPLOYEE");
        user.setGender("MALE");
        user.setJoinDate(LocalDate.of(2025, 1, 1));
        leaveBalance = new LeaveBalance();
        Map<Integer, Double> monthlyClAccrual = new HashMap<>();
        for (int i = 1; i <= 12; i++) {
            monthlyClAccrual.put(i, 1.0);
        }
        leaveBalance.setMonthlyClAccrual(monthlyClAccrual);
        leaveBalance.setCasualLeaveUsed(0.0);
        leaveBalance.setEarnedLeaveUsedFirstHalf(0.0);
        leaveBalance.setEarnedLeaveUsedSecondHalf(0.0);
        leaveBalance.setPaternityLeaveUsed(0.0);
        leaveBalance.setPaternityLeaveRemaining(15.0);
        user.setLeaveBalance(leaveBalance);

        when(userService.getCurrentUser()).thenReturn(user);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(leaveApplicationRepository.save(any(LeaveApplication.class))).thenAnswer(invocation -> {
            LeaveApplication app = invocation.getArgument(0);
            app.setId(1L);
            return app;
        });
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void testMidYearJoiningClAccrual() {
        user.setJoinDate(LocalDate.of(2025, 6, 1));
        Map<String, Object> balance = leaveService.getLeaveBalance();
        Object clBalanceObj = balance.get("casualLeave");
        assertTrue(clBalanceObj instanceof Map, "casualLeave should be a Map");
        @SuppressWarnings("unchecked")
        Map<String, Double> clBalance = (Map<String, Double>) clBalanceObj;
        assertEquals(7.0, clBalance.get("total"), "Employee joining in June should have 7 CLs for 2025");
    }

    @Test
    void testAdvanceClApplication() {
        // Setup user
        User user = new User();
        user.setId(1L);
        user.setRole("EMPLOYEE");
        user.setJoinDate(LocalDate.now().withMonth(1).withDayOfMonth(1));
        LeaveBalance leaveBalance = new LeaveBalance();
        Map<Integer, Double> clAccrual = new HashMap<>();
        for (int month = 1; month <= 12; month++) {
            clAccrual.put(month, 1.0); // 12 CLs
        }
        leaveBalance.setMonthlyClAccrual(clAccrual);
        leaveBalance.setCasualLeaveUsed(0.0);
        leaveBalance.setCasualLeaveRemaining(12.0);
        user.setLeaveBalance(leaveBalance);
        User reportingTo = new User();
        reportingTo.setId(2L);
        reportingTo.setRole("PROJECT_MANAGER");
        user.setReportingTo(reportingTo);
        when(userService.getCurrentUser()).thenReturn(user);
        when(userRepository.save(any(User.class))).thenReturn(user);

        // Setup leave application
        LeaveApplication application = new LeaveApplication();
        application.setLeaveType("CL");
        LocalDate currentDate = LocalDate.now();
        application.setStartDate(currentDate.plusMonths(1).withDayOfMonth(1)); // Next month
        application.setEndDate(currentDate.plusMonths(1).withDayOfMonth(1)); // 1 day
        when(leaveApplicationRepository.save(any(LeaveApplication.class))).thenAnswer(invocation -> {
            LeaveApplication app = invocation.getArgument(0);
            app.setId(1L);
            return app;
        });
        when(leaveApplicationRepository.findOverlappingLeaves(any(), any(), any())).thenReturn(List.of());

        // Execute
        LeaveApplication result = leaveService.applyLeave(application);

        // Assert
        assertNotNull(result);
        assertEquals("PENDING", result.getStatus());
        assertEquals(1L, result.getId());
    }

    @Test
    void testAdvanceClApplicationExceedsBalance() {
        // Setup user with limited CL
        User user = new User();
        user.setId(1L);
        user.setRole("EMPLOYEE");
        user.setJoinDate(LocalDate.now().withMonth(6).withDayOfMonth(1)); // Joined June 1
        LeaveBalance leaveBalance = new LeaveBalance();
        Map<Integer, Double> clAccrual = new HashMap<>();
        for (int month = 6; month <= 12; month++) {
            clAccrual.put(month, 1.0); // 7 CLs total
        }
        leaveBalance.setMonthlyClAccrual(clAccrual);
        leaveBalance.setCasualLeaveUsed(6.0); // Used 6 CLs
        leaveBalance.setCasualLeaveRemaining(1.0); // 1 CL remaining
        user.setLeaveBalance(leaveBalance);
        User reportingTo = new User();
        reportingTo.setId(2L);
        user.setReportingTo(reportingTo);
        when(userService.getCurrentUser()).thenReturn(user);
        when(userRepository.save(any(User.class))).thenReturn(user);

        // Setup leave application
        LeaveApplication application = new LeaveApplication();
        application.setLeaveType("CL");
        LocalDate currentDate = LocalDate.now();
        application.setStartDate(currentDate.plusDays(1));
        application.setEndDate(currentDate.plusDays(2)); // 2 days (exceeds 1 CL)
        when(leaveApplicationRepository.save(any(LeaveApplication.class))).thenAnswer(invocation -> {
            LeaveApplication app = invocation.getArgument(0);
            app.setId(1L);
            return app;
        });
        when(leaveApplicationRepository.findOverlappingLeaves(any(), any(), any())).thenReturn(List.of());

        // Execute and assert
        boolean exceptionThrown = false;
        try {
            leaveService.applyLeave(application);
        } catch (RuntimeException e) {
            exceptionThrown = true;
            assertTrue(e.getMessage().contains("Insufficient CL balance"));
        }
        assertTrue(exceptionThrown, "Expected Insufficient CL balance exception");
    }

    @Test
    void testMaxElFirstHalf() {
        // Setup user
        User user = new User();
        user.setId(1L);
        user.setRole("EMPLOYEE");
        user.setJoinDate(LocalDate.now().withMonth(1).withDayOfMonth(1)); // Joined Jan 1
        user.setGender("MALE");
        LeaveBalance leaveBalance = new LeaveBalance();
        leaveBalance.setEarnedLeaveUsedFirstHalf(0.0);
        leaveBalance.setEarnedLeaveRemaining(10.0);
        user.setLeaveBalance(leaveBalance);
        User reportingTo = new User();
        reportingTo.setId(2L);
        reportingTo.setRole("PROJECT_MANAGER");
        user.setReportingTo(reportingTo);
        when(userService.getCurrentUser()).thenReturn(user); // Employee for applying leave
        when(userRepository.save(any(User.class))).thenReturn(user);

        // Setup leave application
        LeaveApplication application = new LeaveApplication();
        application.setId(1L); // Set ID for approval
        application.setLeaveType("EL");
        LocalDate currentDate = LocalDate.now();
        application.setStartDate(currentDate.plusDays(1)); // Future date
        application.setEndDate(currentDate.plusDays(10)); // 10 days
        application.setUser(user);
        application.setApproverId(2L); // Set approver to manager
        when(leaveApplicationRepository.save(any(LeaveApplication.class))).thenAnswer(invocation -> {
            LeaveApplication app = invocation.getArgument(0);
            app.setId(1L);
            return app;
        });
        when(leaveApplicationRepository.findOverlappingLeaves(any(), any(), any())).thenReturn(List.of());
        when(leaveApplicationRepository.findById(1L)).thenReturn(java.util.Optional.of(application));

        // Apply leave as employee
        LeaveApplication result = leaveService.applyLeave(application);

        // Simulate approval by manager
        when(userService.getCurrentUser()).thenReturn(reportingTo); // Switch to manager
        when(authentication.getPrincipal()).thenReturn(reportingTo);
        leaveService.approveLeave(1L); // Approve leave as manager

        // Assert
        assertNotNull(result);
        assertEquals("APPROVED", result.getStatus()); // Check approval
        assertEquals(10.0, leaveBalance.getEarnedLeaveUsedFirstHalf(), "10 days used in first half");
        assertEquals(0.0, leaveBalance.getEarnedLeaveRemaining(), "0 days remaining");
    }

    @Test
    void testElCarryover() {
        // Setup user
        int currentYear = 2025;
        User user = new User();
        user.setId(1L);
        user.setRole("EMPLOYEE");
        user.setJoinDate(LocalDate.of(currentYear, 1, 1)); // Joined Jan 1
        LeaveBalance leaveBalance = new LeaveBalance();
        leaveBalance.setEarnedLeaveUsedFirstHalf(5.0); // Used 5 ELs
        leaveBalance.setEarnedLeaveUsedSecondHalf(0.0);
        leaveBalance.setEarnedLeaveRemaining(10.0);
        user.setLeaveBalance(leaveBalance);
        User reportingTo = new User();
        reportingTo.setId(2L);
        reportingTo.setRole("PROJECT_MANAGER");
        user.setReportingTo(reportingTo);
        when(userService.getCurrentUser()).thenReturn(user);
        when(userRepository.save(any(User.class))).thenReturn(user);

        // Mock LocalDate.now() consistently
        try (MockedStatic<LocalDate> mockedLocalDate = mockStatic(LocalDate.class, CALLS_REAL_METHODS)) {
            LocalDate mockDate = LocalDate.of(currentYear, 7, 1); // July 1
            mockedLocalDate.when(LocalDate::now).thenReturn(mockDate);

            // Check balance
            Map<String, Object> balance = leaveService.getLeaveBalance();
            Object earnedLeaveObj = balance.get("earnedLeave");
            assertTrue(earnedLeaveObj instanceof Map, "earnedLeave should be a Map");
            @SuppressWarnings("unchecked")
            Map<String, Object> earnedLeave = (Map<String, Object>) earnedLeaveObj;
            double elRemaining = ((Number) earnedLeave.get("remaining")).doubleValue();

            // Assert
            assertEquals(15.0, elRemaining, "Should have 5 ELs carried over + 10 for second half");
        }
    }

    @Test
    void testPreviousYearJoining() {
        user.setJoinDate(LocalDate.of(LocalDate.now().getYear() - 1, 1, 1)); // Joined last year
        Map<String, Object> balance = leaveService.getLeaveBalance();
        Object clBalanceObj = balance.get("casualLeave");
        Object elBalanceObj = balance.get("earnedLeave");
        assertTrue(clBalanceObj instanceof Map, "casualLeave should be a Map");
        assertTrue(elBalanceObj instanceof Map, "earnedLeave should be a Map");
        @SuppressWarnings("unchecked")
        Map<String, Double> clBalance = (Map<String, Double>) clBalanceObj;
        @SuppressWarnings("unchecked")
        Map<String, Double> elBalance = (Map<String, Double>) elBalanceObj;
        assertEquals(12.0, clBalance.get("total"), "Full year CL accrual");
        assertEquals(20.0, elBalance.get("total"), "Full year EL accrual");
    }
}