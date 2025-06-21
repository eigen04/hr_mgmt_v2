package com.hr_management.service;

import com.hr_management.Entity.LeaveApplication;
import com.hr_management.Entity.LeaveApplicationDTO;
import java.util.List;
import java.util.Map;

public interface LeaveService {
    LeaveApplication applyLeave(LeaveApplication application);
    List<LeaveApplication> getUserLeaves();
    Map<String, Object> getLeaveBalance();
    List<LeaveApplicationDTO> getPendingLeavesForCurrentUser();
    Map<String, Integer> getLeaveStatsForCurrentUser();
    void approveLeave(Long leaveId);
    void rejectLeave(Long leaveId);
}