package com.hr_management.Controller;

import com.hr_management.Entity.Holiday;
import com.hr_management.service.HolidayService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/holidays")
public class PublicHolidayController {

    private static final Logger logger = LoggerFactory.getLogger(PublicHolidayController.class);

    @Autowired
    private HolidayService holidayService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Holiday>> getHolidays(@RequestParam(required = false) String startDate,
                                                     @RequestParam(required = false) String endDate) {
        try {
            List<Holiday> holidays;
            if (startDate != null && endDate != null) {
                LocalDate start = LocalDate.parse(startDate);
                LocalDate end = LocalDate.parse(endDate);
                holidays = holidayService.getHolidaysByDateRange(start, end);
            } else {
                holidays = holidayService.getAllHolidays();
            }
            logger.info("Fetched {} holidays for range {} to {}", holidays.size(), startDate, endDate);
            return ResponseEntity.ok(holidays);
        } catch (Exception e) {
            logger.error("Error fetching holidays: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }
}