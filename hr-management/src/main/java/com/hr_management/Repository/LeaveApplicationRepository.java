package com.hr_management.Repository;

import com.hr_management.Entity.LeaveApplication;
import com.hr_management.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
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
    List<LeaveApplication> findByUserIdInAndStatus(List<Long> userIds, String status);

    List<LeaveApplication> findByUserAndStatus(User user, String status);

    @Query("SELECT la FROM LeaveApplication la WHERE la.approverId = :approverId AND la.status = :status")
    List<LeaveApplication> findByApproverIdAndStatus(@Param("approverId") Long approverId, @Param("status") String status);

    @Query("SELECT COUNT(la) FROM LeaveApplication la WHERE la.approverId = :approverId AND la.status = :status")
    long countByApproverIdAndStatus(@Param("approverId") Long approverId, @Param("status") String status);

    List<LeaveApplication> findByUserAndStartDate(@Param("user") User user, @Param("startDate") LocalDate startDate);

    @Query("SELECT la FROM LeaveApplication la WHERE la.user = :user " +
            "AND la.status IN ('PENDING', 'APPROVED') " +
            "AND la.startDate <= :endDate AND la.endDate >= :startDate")
    List<LeaveApplication> findOverlappingLeaves(
            @Param("user") User user,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT la FROM LeaveApplication la WHERE la.user = :user " +
            "AND la.leaveType IN :leaveTypes " +
            "AND la.startDate BETWEEN :startDate AND :endDate " +
            "AND la.status = 'APPROVED'")
    List<LeaveApplication> findByUserAndLeaveTypeInAndStartDateBetween(
            @Param("user") User user,
            @Param("leaveTypes") List<String> leaveTypes,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(la) FROM LeaveApplication la WHERE la.user.id IN :userIds AND la.status = :status")
    long countByUserIdInAndStatus(@Param("userIds") List<Long> userIds, @Param("status") String status);

    @Query("SELECT la FROM LeaveApplication la WHERE la.approverId = :approverId AND la.status = 'APPROVED' " +
            "AND la.endDate >= :currentDate AND la.endDate <= :cancellationDeadline")
    List<LeaveApplication> findCancellableLeavesByApproverId(
            @Param("approverId") Long approverId,
            @Param("currentDate") LocalDate currentDate,
            @Param("cancellationDeadline") LocalDate cancellationDeadline);
}