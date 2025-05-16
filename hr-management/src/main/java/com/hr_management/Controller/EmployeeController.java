package com.hr_management.Controller;

import com.hr_management.Entity.User;
import com.hr_management.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employee")
@CrossOrigin(origins = "${frontend.url:http://localhost:5173}")
public class EmployeeController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/user")
    public ResponseEntity<?> getUserDetails(@AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails.getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(new UserResponse(
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getDepartment(),
                user.getRole()
        ));
    }
}

class UserResponse {
    private String fullName;
    private String username;
    private String email;
    private String department;
    private String role;

    public UserResponse(String fullName, String username, String email, String department, String role) {
        this.fullName = fullName;
        this.username = username;
        this.email = email;
        this.department = department;
        this.role = role;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}