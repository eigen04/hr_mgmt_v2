package com.hr_management.Controller;

import com.hr_management.Entity.Role;
import com.hr_management.Repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleRepository roleRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, String>>> getAllRoles() {
        try {
            List<Map<String, String>> roles = roleRepository.findAll().stream()
                    .map(role -> Map.of(
                            "id", role.getId().toString(),
                            "name", normalizeRoleName(role.getName()) // Normalize role name
                    ))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(roles);
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
            Role savedRole = roleRepository.save(role);
            return ResponseEntity.ok(Map.of(
                    "id", savedRole.getId().toString(),
                    "name", normalizeRoleName(savedRole.getName())
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Collections.singletonMap("message", "An error occurred: " + e.getMessage()));
        }
    }

    // Helper method to normalize role names
    private String normalizeRoleName(String roleName) {
        if (roleName == null) return "";
        String normalized = roleName.trim();
        if (normalized.equalsIgnoreCase("director")) {
            return "director";
        } else if (normalized.equalsIgnoreCase("hr")) {
            return "HR";
        } else {
            return normalized.toUpperCase();
        }
    }
}