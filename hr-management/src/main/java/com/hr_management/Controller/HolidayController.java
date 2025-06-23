package com.hr_management.Controller;

import com.hr_management.Entity.Holiday;
import com.hr_management.service.HolidayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr/holidays")
public class HolidayController {

    @Autowired
    private HolidayService holidayService;

    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'DIRECTOR')")
    public ResponseEntity<List<Holiday>> getAllHolidays() {
        try {
            List<Holiday> holidays = holidayService.getAllHolidays();
            return ResponseEntity.ok(holidays);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR', 'DIRECTOR')")
    public ResponseEntity<?> addHoliday(@RequestBody Holiday holiday) {
        try {
            Holiday savedHoliday = holidayService.addHoliday(holiday);
            return ResponseEntity.ok(savedHoliday);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400)
                    .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Collections.singletonMap("message", "An error occurred: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR', 'DIRECTOR')")
    public ResponseEntity<Map<String, String>> deleteHoliday(@PathVariable Long id) {
        try {
            holidayService.deleteHoliday(id);
            return ResponseEntity.ok(Collections.singletonMap("message", "Holiday deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400)
                    .body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Collections.singletonMap("message", "An error occurred: " + e.getMessage()));
        }
    }
}