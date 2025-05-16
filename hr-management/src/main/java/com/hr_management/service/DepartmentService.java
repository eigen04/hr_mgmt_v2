package com.hr_management.service;

import com.hr_management.Entity.Department;
import com.hr_management.Entity.LeaveApplication;
import com.hr_management.Entity.User;
import com.hr_management.Repository.DepartmentRepository;
import com.hr_management.Repository.LeaveApplicationRepository;
import com.hr_management.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    private static final Logger logger = LoggerFactory.getLogger(DepartmentService.class);

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeaveApplicationRepository leaveApplicationRepository;

    // Add a new department
    public Department addDepartment(Department department) {
        // Validate department name
        if (department.getName() == null || department.getName().trim().isEmpty()) {
            logger.error("Attempted to add a department with null or empty name.");
            throw new IllegalArgumentException("Department name cannot be empty");
        }

        // Check for duplicate department name
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
        LocalDate today = LocalDate.now(); // Current date (e.g., May 14, 2025)

        for (Department dept : departments) {
            // Calculate employee count
            long employeeCount = userRepository.countByDepartment(dept.getName());
            dept.setEmployeeCount((int) employeeCount);

            // Calculate onLeaveCount (approved leaves active today)
            List<LeaveApplication> onLeaveApplications = leaveApplicationRepository.findCurrentlyOnLeaveByDepartment(dept.getName());
            dept.setOnLeaveCount(onLeaveApplications.size());
        }

        return departments;
    }

    // Get Department by Name
    public Optional<Department> getDepartmentByName(String name) {
        return departmentRepository.findByName(name);
    }

    // Fetch employees by department ID
    public List<User> getEmployeesByDepartmentId(Long deptId) {
        Optional<Department> departmentOpt = departmentRepository.findById(deptId);
        if (departmentOpt.isPresent()) {
            String departmentName = departmentOpt.get().getName();
            return userRepository.findByDepartment(departmentName);
        }
        return List.of(); // Return empty list if department not found
    }

    // Fetch leave applications by user ID
    public List<LeaveApplication> getLeaveApplicationsByUserId(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            return leaveApplicationRepository.findByUserAndStatus(userOpt.get(), "APPROVED");
        }
        return List.of();
    }
}