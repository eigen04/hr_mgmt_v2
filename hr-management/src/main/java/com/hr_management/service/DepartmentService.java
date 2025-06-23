package com.hr_management.service;

import com.hr_management.Entity.*;
import com.hr_management.Repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DepartmentService {

    private static final Logger logger = LoggerFactory.getLogger(DepartmentService.class);

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeaveApplicationRepository leaveApplicationRepository;

    @Autowired
    private HolidayService holidayService; // New dependency

    // Helper method to check if a date is a working day
    private boolean isWorkingDay(LocalDate date) {
        return !holidayService.isHoliday(date); // Use HolidayService to check for holidays
    }

    // Add a new department
    public Department addDepartment(Department department) {
        if (department.getName() == null || department.getName().trim().isEmpty()) {
            logger.error("Attempted to add a department with null or empty name.");
            throw new IllegalArgumentException("Department name cannot be empty");
        }

        Optional<Department> existingDepartment = departmentRepository.findByName(department.getName());
        if (existingDepartment.isPresent()) {
            logger.warn("Department with name '{}' already exists.", department.getName());
            throw new IllegalArgumentException("A department with the name '" + department.getName() + "' already exists");
        }

        try {
            Department savedDepartment = departmentRepository.save(department);
            logger.info("Successfully added department: {}", savedDepartment.getName());
            return savedDepartment;
        } catch (Exception e) {
            logger.error("Failed to add department '{}': {}", department.getName(), e.getMessage(), e);
            throw new RuntimeException("Failed to add department due to a server error: " + e.getMessage());
        }
    }

    // Get total number of departments
    public int getTotalDepartments() {
        return (int) departmentRepository.count();
    }

    // Get number of active HODs (users with role "HOD")
    public int getActiveHods() {
        return (int) userRepository.countByRole("HOD");
    }

    // Fetch all departments with employeeCount and onLeaveCount
    public List<Department> getAllDepartments() {
        List<Department> departments = departmentRepository.findAll();
        LocalDate today = LocalDate.now();

        for (Department dept : departments) {
            // Fetch users in the department
            List<User> deptUsers = userRepository.findByDepartment(dept.getName());
            dept.setEmployeeCount(deptUsers.size());

            // Fetch leave applications for users in this department
            List<Long> userIds = deptUsers.stream().map(User::getId).collect(Collectors.toList());
            List<LeaveApplication> leaveApplications = userIds.isEmpty() ? List.of() :
                    leaveApplicationRepository.findByUserIdInAndStatus(userIds, "APPROVED");

            // Calculate onLeaveCount (approved leaves active today)
            Set<Long> onLeaveUserIds = leaveApplications.stream()
                    .filter(la -> {
                        LocalDate startDate = la.getStartDate();
                        LocalDate endDate = la.getEndDate() != null ? la.getEndDate() : startDate;
                        boolean overlapsToday = (startDate.isEqual(today) || startDate.isBefore(today)) &&
                                (endDate.isEqual(today) || endDate.isAfter(today));
                        if (!overlapsToday) return false;

                        // Apply working day logic for CASUAL, LWP, HALF_DAY_CL, HALF_DAY_LWP
                        String leaveType = la.getLeaveType();
                        if (List.of("CASUAL", "LWP", "HALF_DAY_CL", "HALF_DAY_LWP").contains(leaveType)) {
                            return isWorkingDay(today);
                        }
                        return true;
                    })
                    .map(la -> la.getUser().getId())
                    .collect(Collectors.toSet());
            dept.setOnLeaveCount(onLeaveUserIds.size());

            logger.debug("Department '{}': employeeCount={}, onLeaveCount={}", dept.getName(), dept.getEmployeeCount(), dept.getOnLeaveCount());
        }

        return departments;
    }

    // Get Department by Name
    public Optional<Department> getDepartmentByName(String name) {
        return departmentRepository.findByName(name);
    }

    // Get Department by ID
    public Optional<Department> getDepartmentById(Long id) {
        return departmentRepository.findById(id);
    }

    // Fetch employees by department ID, filtered by reportingTo for PROJECT_MANAGER
    public List<User> getEmployeesByDepartmentId(Long deptId, Long currentUserId, String userRole) {
        Optional<Department> departmentOpt = departmentRepository.findById(deptId);
        if (departmentOpt.isEmpty()) {
            logger.warn("Department not found with id: {}", deptId);
            return List.of();
        }
        String departmentName = departmentOpt.get().getName();

        List<User> employees;
        if ("PROJECT_MANAGER".equals(userRole)) {
            // For project managers, fetch only employees reporting to them
            employees = userRepository.findByDepartmentAndReportingToId(departmentName, currentUserId);
            logger.debug("Fetched {} employees reporting to PROJECT_MANAGER (ID: {}) in department '{}'", employees.size(), currentUserId, departmentName);
        } else {
            // For other roles (DIRECTOR, ASSISTANT_DIRECTOR, HR), fetch all employees in the department
            employees = userRepository.findByDepartment(departmentName);
            logger.debug("Fetched {} employees in department '{}'", employees.size(), departmentName);
        }
        return employees;
    }

    // Fetch leave applications by user ID
    public List<LeaveApplication> getLeaveApplicationsByUserId(Long userId) {
        return leaveApplicationRepository.findByUserIdAndStatus(userId, "APPROVED");
    }

    // Fetch department-specific metrics
    public DepartmentMetrics getDepartmentMetrics(Long departmentId) {
        Optional<Department> departmentOpt = departmentRepository.findById(departmentId);
        if (departmentOpt.isEmpty()) {
            logger.warn("Department not found with id: {}", departmentId);
            throw new IllegalArgumentException("Department not found with id: " + departmentId);
        }
        String departmentName = departmentOpt.get().getName();
        logger.debug("Fetching metrics for department: {}", departmentName);

        DepartmentMetrics metrics = new DepartmentMetrics();
        LocalDate today = LocalDate.now();

        // Fetch users in the department
        List<User> deptUsers = userRepository.findByDepartment(departmentName);

        // Total Employees (excluding ASSISTANT_DIRECTOR)
        long totalEmployees = deptUsers.stream()
                .filter(user -> user.getRole().equals("EMPLOYEE"))
                .count();
        metrics.setTotalEmployees(totalEmployees);

        // Fetch leave applications for users in this department
        List<Long> userIds = deptUsers.stream().map(User::getId).collect(Collectors.toList());
        List<LeaveApplication> leaveApplications = userIds.isEmpty() ? List.of() :
                leaveApplicationRepository.findByUserIdInAndStatus(userIds, "APPROVED");

        // On Leave Today (approved leaves that overlap with today)
        Set<Long> onLeaveUserIds = leaveApplications.stream()
                .filter(la -> {
                    LocalDate startDate = la.getStartDate();
                    LocalDate endDate = la.getEndDate() != null ? la.getEndDate() : startDate;
                    boolean overlapsToday = (startDate.isEqual(today) || startDate.isBefore(today)) &&
                            (endDate.isEqual(today) || endDate.isAfter(today));
                    if (!overlapsToday) return false;

                    // Apply working day logic for CASUAL, LWP, HALF_DAY_CL, HALF_DAY_LWP
                    String leaveType = la.getLeaveType();
                    if (List.of("CASUAL", "LWP", "HALF_DAY_CL", "HALF_DAY_LWP").contains(leaveType)) {
                        return isWorkingDay(today);
                    }
                    return true;
                })
                .map(la -> la.getUser().getId())
                .collect(Collectors.toSet());
        metrics.setOnLeaveToday(onLeaveUserIds.size());

        // Total Assistant Directors in the department
        long assistantDirectors = deptUsers.stream()
                .filter(user -> user.getRole().equals("ASSISTANT_DIRECTOR"))
                .count();
        metrics.setAssistantDirectors(assistantDirectors);

        // Total Project Managers in the department
        long projectManagers = deptUsers.stream()
                .filter(user -> user.getRole().equals("PROJECT_MANAGER"))
                .count();
        metrics.setProjectManagers(projectManagers);

        logger.info("Metrics for department '{}': totalEmployees={}, onLeaveToday={}, assistantDirectors={}, projectManagers={}",
                departmentName, totalEmployees, onLeaveUserIds.size(), assistantDirectors, projectManagers);

        return metrics;
    }
}