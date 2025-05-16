package com.hr_management.Repository;

import com.hr_management.Entity.LeaveApplication;
import com.hr_management.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LeaveApplicationRepository extends JpaRepository<LeaveApplication, Long> {

    List<LeaveApplication> findByUser(User user);

    @Query("SELECT la FROM LeaveApplication la WHERE la.user.department = :department AND la.status = 'PENDING'")
    List<LeaveApplication> findPendingByDepartment(@Param("department") String department);

    @Query("SELECT la FROM LeaveApplication la WHERE la.user.department = :department AND la.status = 'APPROVED' AND CURRENT_DATE BETWEEN la.startDate AND la.endDate")
    List<LeaveApplication> findCurrentlyOnLeaveByDepartment(@Param("department") String department);

    @Query("SELECT la FROM LeaveApplication la WHERE la.status = :status AND la.user.role = :role")
    List<LeaveApplication> findByStatusAndUserRole(@Param("status") String status, @Param("role") String role);

    @Query("SELECT COUNT(la) FROM LeaveApplication la WHERE la.status = :status AND la.user.role = :role")
    long countByStatusAndUserRole(@Param("status") String status, @Param("role") String role);

    @Query("SELECT la FROM LeaveApplication la WHERE la.status = 'APPROVED' AND la.user.role = 'EMPLOYEE' AND :date BETWEEN la.startDate AND la.endDate")
    List<LeaveApplication> findApprovedLeavesOnDate(@Param("date") LocalDate date);

    List<LeaveApplication> findByUserIdAndStatus(Long userId, String status);
    List<LeaveApplication> findByUserAndStatus(User user, String status);

    // New method to find leave applications by approverId and status
    @Query("SELECT la FROM LeaveApplication la WHERE la.approverId = :approverId AND la.status = :status")
    List<LeaveApplication> findByApproverIdAndStatus(@Param("approverId") Long approverId, @Param("status") String status);
}