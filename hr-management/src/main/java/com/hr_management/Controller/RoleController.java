package com.hr_management.Controller;

import com.hr_management.Entity.Role;
import com.hr_management.Repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "${frontend.url:http://localhost:5173}")
public class RoleController {

    @Autowired
    private RoleRepository roleRepository;

    @GetMapping
    public ResponseEntity<List<Role>> getAllRoles() {
        try {
            return ResponseEntity.ok(roleRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('DIRECTOR')")
    public ResponseEntity<?> addRole(@RequestBody Role role) {
        try {
            if (roleRepository.existsByName(role.getName())) {
                return ResponseEntity.status(400)
                        .body(Collections.singletonMap("message", "Role name already exists"));
            }
            roleRepository.save(role);
            return ResponseEntity.ok(Collections.singletonMap("message", "Role added successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Collections.singletonMap("message", "An error occurred: " + e.getMessage()));
        }
    }
}