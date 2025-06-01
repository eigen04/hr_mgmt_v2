package com.hr_management.service;

import com.hr_management.Entity.Department;
import com.hr_management.Entity.User;
import com.hr_management.Entity.LeaveBalance;
import com.hr_management.Repository.DepartmentRepository;
import com.hr_management.Repository.UserRepository;
import com.hr_management.Util.JwtUtil;
import com.hr_management.dto.ReportingPersonDTO;
import com.hr_management.dto.UserDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder; // Add this dependency

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        logger.debug("Loading user by username: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        String role = "ROLE_" + user.getRole().toUpperCase();
        logger.debug("Assigning role: {} to user: {}", role, username);
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(), user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(role)));
    }

    public User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }

    public String generateToken(User user) {
        return jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getDepartment());
    }

    public List<User> getEmployeesByDepartment(Long deptId) {
        Department department = departmentRepository.findById(deptId)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + deptId));
        String departmentName = department.getName();
        return userRepository.findByDepartment(departmentName);
    }

    public User findHodByDepartment(String departmentName) {
        return userRepository.findByDepartmentAndRole(departmentName, "HOD")
                .orElseThrow(() -> new RuntimeException("No HOD found for department: " + departmentName));
    }

    public User findDirector() {
        Optional<User> director = userRepository.findByRole("director").stream().findFirst();
        if (director.isEmpty()) {
            logger.error("No Director found in the system");
            throw new RuntimeException("No Director found");
        }
        return director.get();
    }

    public List<User> getHods() {
        return userRepository.findByRole("HOD");
    }

    public void updateUserStatus(Long id, String newStatus) {
        if (!newStatus.equals("ACTIVE") && !newStatus.equals("INACTIVE")) {
            throw new RuntimeException("Invalid status");
        }
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        User user = optionalUser.get();
        user.setStatus(newStatus);
        userRepository.save(user);
    }

    private String normalizeDepartment(String deptName) {
        if (deptName == null) return null;
        if (deptName.toLowerCase().contains("admin")) {
            return deptName.toLowerCase().contains("administration") ? "Administration" : "Admin";
        }
        return deptName;
    }

    public List<ReportingPersonDTO> getPotentialReportingPersons(String role, String department) {
        logger.info("Fetching reporting persons for role: {}, department: {}", role, department);
        String normalizedDept = normalizeDepartment(department);
        logger.debug("Normalized department: {}", normalizedDept);

        if ((normalizedDept != null && (normalizedDept.equalsIgnoreCase("Admin") || normalizedDept.equalsIgnoreCase("Administration"))
                && role != null && role.equalsIgnoreCase("HR")) ||
                (role != null && role.equalsIgnoreCase("director"))) {
            logger.debug("No reporting persons required for role: {}, department: {}", role, normalizedDept);
            return Collections.emptyList();
        }

        List<User> users;
        switch (role.toUpperCase()) {
            case "EMPLOYEE":
                logger.debug("Querying users with role: PROJECT_MANAGER, department: {}, status: ACTIVE", normalizedDept);
                users = userRepository.findByRoleIgnoreCaseAndDepartmentAndStatus("PROJECT_MANAGER", normalizedDept, "ACTIVE");
                logger.debug("Found {} PROJECT_MANAGER users: {}", users.size(), users);
                break;
            case "PROJECT_MANAGER":
                logger.debug("Querying users with role: ASSISTANT_DIRECTOR, department: {}, status: ACTIVE", normalizedDept);
                users = userRepository.findByRoleIgnoreCaseAndDepartmentAndStatus("ASSISTANT_DIRECTOR", normalizedDept, "ACTIVE");
                logger.debug("Found {} ASSISTANT_DIRECTOR users: {}", users.size(), users);
                break;
            case "ASSISTANT_DIRECTOR":
                logger.debug("Querying users with role: DIRECTOR, status: ACTIVE");
                users = userRepository.findByRoleIgnoreCaseAndStatus("DIRECTOR", "ACTIVE");
                logger.debug("Found {} DIRECTOR users: {}", users.size(), users);
                break;
            default:
                logger.warn("No reporting persons for role: {}, department: {}", role, normalizedDept);
                users = Collections.emptyList();
        }
        List<ReportingPersonDTO> dtos = users.stream()
                .map(user -> new ReportingPersonDTO(user.getId(), user.getFullName(), user.getRole(), user.getEmail()))
                .collect(Collectors.toList());
        logger.info("Reporting persons found: {}", dtos);
        return dtos;
    }

    // New signup method
    public User signup(UserDTO userDTO) {
        // Validate username and email uniqueness
        if (userRepository.existsByUsername(userDTO.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Validate department for non-Director roles
        if (!"director".equalsIgnoreCase(userDTO.getRole())) {
            if (userDTO.getDepartment() == null || userDTO.getDepartment().isBlank()) {
                throw new IllegalArgumentException("Department is required for non-Director roles");
            }
        } else {
            if (userDTO.getDepartment() != null && !userDTO.getDepartment().isBlank()) {
                throw new IllegalArgumentException("Department must be null for Director role");
            }
        }

        // Look up the department by name for non-Director roles
        Department departmentEntity = null;
        if (!"director".equalsIgnoreCase(userDTO.getRole())) {
            String normalizedDept = normalizeDepartment(userDTO.getDepartment());
            departmentEntity = departmentRepository.findByName(normalizedDept)
                    .orElseThrow(() -> new IllegalArgumentException("Department not found: " + normalizedDept));
        }

        // Initialize leave balances based on role and gender
        LeaveBalance leaveBalance = new LeaveBalance();
        leaveBalance.setCasualLeaveUsed(0.0);
        leaveBalance.setCasualLeaveRemaining(userDTO.getRole().equalsIgnoreCase("ASSISTANT_DIRECTOR") ? 12.0 : 10.0);
        leaveBalance.setEarnedLeaveUsed(0.0);
        leaveBalance.setEarnedLeaveRemaining(userDTO.getRole().equalsIgnoreCase("ASSISTANT_DIRECTOR") ? 20.0 : 15.0);
        leaveBalance.setMaternityLeaveUsed(0.0);
        leaveBalance.setMaternityLeaveRemaining(userDTO.getGender().equalsIgnoreCase("Female") ? 182.0 : 0.0);
        leaveBalance.setPaternityLeaveUsed(0.0);
        leaveBalance.setPaternityLeaveRemaining(userDTO.getGender().equalsIgnoreCase("Male") ? 15.0 : 0.0);

        // Create the User entity
        User user = new User();
        user.setFullName(userDTO.getFullName());
        user.setUsername(userDTO.getUsername());
        user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        user.setEmail(userDTO.getEmail());
        user.setDepartment(userDTO.getDepartment()); // Set the department name temporarily
        user.setDepartmentEntity(departmentEntity); // This sets the department_id
        user.setRole(userDTO.getRole());
        user.setGender(userDTO.getGender());
        user.setLeaveBalance(leaveBalance);
        user.setStatus("ACTIVE");
        user.setLeaveWithoutPayment(0.0);
        user.setHalfDayLwp(0.0);

        // Set reportingTo if provided
        if (userDTO.getReportingToId() != null) {
            User reportingTo = userRepository.findById(userDTO.getReportingToId())
                    .orElseThrow(() -> new IllegalArgumentException("Reporting person not found with ID: " + userDTO.getReportingToId()));
            user.setReportingTo(reportingTo);
        }

        return userRepository.save(user);
    }
}