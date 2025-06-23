package com.hr_management.service;

import com.hr_management.Entity.Holiday;
import com.hr_management.Repository.HolidayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class HolidayService {

    @Autowired
    private HolidayRepository holidayRepository;

    public List<Holiday> getAllHolidays() {
        return holidayRepository.findAll();
    }

    public List<Holiday> getHolidaysByDateRange(LocalDate startDate, LocalDate endDate) {
        return holidayRepository.findByDateBetween(startDate, endDate);
    }

    public Holiday addHoliday(Holiday holiday) {
        if (holidayRepository.existsByDate(holiday.getDate())) {
            throw new IllegalArgumentException("A holiday already exists on this date.");
        }
        return holidayRepository.save(holiday);
    }

    public void deleteHoliday(Long id) {
        if (!holidayRepository.existsById(id)) {
            throw new IllegalArgumentException("Holiday not found.");
        }
        holidayRepository.deleteById(id);
    }

    public boolean isHoliday(LocalDate date) {
        return holidayRepository.findByDate(date) != null;
    }
}