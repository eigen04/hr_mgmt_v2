package com.hr_management.service;

import com.hr_management.Entity.Department;
import com.hr_management.Entity.User;
import com.hr_management.Repository.DepartmentRepository;
import com.hr_management.Repository.UserRepository;
import com.hr_management.Util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.Collections;
import java.util.List;

@Service
public class UserService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(), user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase())));
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
        Optional<User> director = userRepository.findByRole("DIRECTOR").stream().findFirst();
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
}