package com.hr_management.service;

import com.hr_management.Entity.LeaveApplication;
import com.hr_management.Entity.LeaveApplicationDTO;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface LeaveService {
    LeaveApplication applyLeave(LeaveApplication application);
    void approveLeave(Long leaveId);
    void rejectLeave(Long leaveId);
    void cancelLeave(Long leaveId);
    List<LeaveApplicationDTO> getPendingLeavesForCurrentUser();
    List<LeaveApplicationDTO> getCancellableLeavesForCurrentUser();
    Map<String, Integer> getLeaveStatsForCurrentUser();
    List<LeaveApplication> getUserLeaves();
    Map<String, Object> getLeaveBalance();
    Map<String, Double> getAvailableClForMonth(int year, int month);
}