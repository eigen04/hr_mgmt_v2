package com.hr_management.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hr")
@CrossOrigin(origins = "http://localhost:5173")
public class HrController {
    @GetMapping("/user") // Adjust method and path as needed
    public ResponseEntity<?> getUser() {
        // Your logic here
        return ResponseEntity.ok("User data");
    }
}