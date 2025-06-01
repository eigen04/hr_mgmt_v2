import { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, FileText, PlusCircle, Clock, AlertCircle, LogOut, UserCheck, UserMinus, Menu, X, CalendarCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ManagerDash() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [myLeaveRequests, setMyLeaveRequests] = useState([]);
  const [leaveStats, setLeaveStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [leaveBalance, setLeaveBalance] = useState({
    casualLeave: { total: 12, used: 0, remaining: 12 },
    earnedLeave: { total: 20, used: 0, remaining: 20 },
    maternityLeave: { total: 182, used: 0, remaining: 182 },
    paternityLeave: { total: 15, used: 0, remaining: 15 },
    leaveWithoutPay: { total: 300, used: 0, remaining: 300 }
  });
  const [userData, setUserData] = useState(null);
  const [departmentData, setDepartmentData] = useState(null);
  const [employeesInDepartment, setEmployeesInDepartment] = useState([]);
  const [overallData, setOverallData] = useState({
    totalEmployees: 0,
    onLeaveToday: 0,
    presentToday: 0
  });
  const [leaveFormData, setLeaveFormData] = useState({
    leaveType: 'CL',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false
  });
  const [leaveDays, setLeaveDays] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0]; // 2025-06-01

  // Utility function to format dates as DD-MM-YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Please log in to continue');
          navigate('/');
          return;
        }

        // Fetch user data
        let user;
        try {
          const userResponse = await fetch('http://localhost:8081/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (userResponse.ok) {
            user = await userResponse.json();
            if (user.role !== 'PROJECT_MANAGER') {
              setError('Access denied. This dashboard is for Project Managers only.');
              navigate('/');
              return;
            }
            setUserData(user);
          } else if (userResponse.status === 401) {
            setError('Session expired. Please log in again.');
            localStorage.removeItem('authToken');
            navigate('/');
            return;
          } else {
            const errorText = await userResponse.text();
            console.error('Failed to fetch user data:', userResponse.status, errorText);
            setError(`Failed to fetch user data: ${errorText}`);
            return;
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to fetch user data due to a network or server error');
          return;
        }

        // Fetch departments
        let userDepartment;
        try {
          const departmentsResponse = await fetch('http://localhost:8081/api/departments', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (departmentsResponse.ok) {
            const departments = await departmentsResponse.json();
            userDepartment = departments.find(dept => dept.name === user.department);
            if (userDepartment) {
              setDepartmentData({
                id: userDepartment.id,
                name: userDepartment.name || 'Unnamed Department',
                description: userDepartment.description || '',
                employeeCount: userDepartment.employeeCount || 0,
                onLeaveCount: userDepartment.onLeaveCount || 0
              });
            } else {
              setError('Your department was not found');
              return;
            }
          } else {
            const errorText = await departmentsResponse.text();
            console.error('Failed to fetch departments:', departmentsResponse.status, errorText);
            setError(`Failed to fetch department data: ${errorText}`);
            return;
          }
        } catch (err) {
          console.error('Error fetching departments:', err);
          setError('Failed to fetch department data due to a network or server error');
          return;
        }

        // Fetch department metrics
        try {
          const dashboardResponse = await fetch(`http://localhost:8081/api/hr/department-metrics/${userDepartment.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (dashboardResponse.ok) {
            const data = await dashboardResponse.json();
            setOverallData({
              totalEmployees: data.totalEmployees || 0,
              onLeaveToday: data.onLeaveToday || 0,
              presentToday: (data.totalEmployees || 0) - (data.onLeaveToday || 0)
            });
          } else if (dashboardResponse.status === 403) {
            setError('You do not have permission to access this department’s metrics');
            return;
          } else {
            const errorText = await dashboardResponse.text();
            console.error('Failed to fetch department metrics:', dashboardResponse.status, errorText);
            setError(`Failed to fetch department metrics: ${errorText}`);
            return;
          }
        } catch (err) {
          console.error('Error fetching department metrics:', err);
          setError('Failed to fetch department metrics due to a network or server error');
          return;
        }

        // Fetch employees in department
        try {
          const employeesResponse = await fetch(`http://localhost:8081/api/hr/departments/${userDepartment.id}/employees`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (employeesResponse.ok) {
            const employees = await employeesResponse.json();
            setEmployeesInDepartment(employees.map(employee => ({
              id: employee.id,
              name: employee.fullName || 'Unnamed Employee',
              position: employee.role || 'Employee'
            })));
          } else {
            const errorText = await employeesResponse.text();
            console.error('Failed to fetch employees:', employeesResponse.status, errorText);
            setError(`Failed to fetch department employees: ${errorText}`);
            // Continue loading other data even if this fails
          }
        } catch (err) {
          console.error('Error fetching employees:', err);
          setError('Failed to fetch department employees due to a network or server error');
          // Continue loading other data
        }

        // Fetch leave balance
        try {
          const balanceResponse = await fetch('http://localhost:8081/api/leaves/balance', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            const sanitizedBalance = {
              casualLeave: balanceData.casualLeave || { total: 12, used: 0, remaining: 12 },
              earnedLeave: balanceData.earnedLeave || { total: 20, used: 0, remaining: 20 },
              maternityLeave: balanceData.maternityLeave || { total: 182, used: 0, remaining: 182 },
              paternityLeave: balanceData.paternityLeave || { total: 15, used: 0, remaining: 15 },
              leaveWithoutPay: balanceData.leaveWithoutPay || { total: 300, used: 0, remaining: 300 }
            };
            Object.keys(sanitizedBalance).forEach((key) => {
              sanitizedBalance[key].used = Number(sanitizedBalance[key].used.toFixed(1));
              sanitizedBalance[key].remaining = Number(sanitizedBalance[key].remaining.toFixed(1));
            });
            setLeaveBalance(sanitizedBalance);
          } else {
            const errorText = await balanceResponse.text();
            console.error('Failed to fetch leave balance:', balanceResponse.status, errorText);
            setError(`Failed to fetch leave balance: ${errorText}`);
            // Continue loading other data
          }
        } catch (err) {
          console.error('Error fetching leave balance:', err);
          setError('Failed to fetch leave balance due to a network or server error');
          // Continue loading other data
        }

        // Fetch pending subordinate leave requests
        try {
          const leaveResponse = await fetch('http://localhost:8081/api/leaves/pending', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (leaveResponse.ok) {
            const leaveData = await leaveResponse.json();
            setLeaveRequests(leaveData);
          } else {
            const errorText = await leaveResponse.text();
            console.error('Failed to fetch subordinate leave requests:', leaveResponse.status, errorText);
            setError(`Failed to fetch subordinate leave applications: ${errorText}`);
            // Continue loading other data
          }
        } catch (err) {
          console.error('Error fetching subordinate leave requests:', err);
          setError('Failed to fetch subordinate leave applications due to a network or server error');
          // Continue loading other data
        }

        // Fetch user's leave applications
        try {
          const myLeaveResponse = await fetch('http://localhost:8081/api/leaves', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (myLeaveResponse.ok) {
            const myLeaveData = await myLeaveResponse.json();
            setMyLeaveRequests(myLeaveData);
          } else {
            const errorText = await myLeaveResponse.text();
            console.error('Failed to fetch user leave applications:', myLeaveResponse.status, errorText);
            setError(`Failed to fetch your leave applications: ${errorText}`);
            // Continue loading other data
          }
        } catch (err) {
          console.error('Error fetching user leave applications:', err);
          setError('Failed to fetch your leave applications due to a network or server error');
          // Continue loading other data
        }

        // Fetch leave stats
        try {
          const statsResponse = await fetch('http://localhost:8081/api/leaves/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setLeaveStats(statsData);
          } else {
            const errorText = await statsResponse.text();
            console.error('Failed to fetch leave stats:', statsResponse.status, errorText);
            setError(`Failed to fetch leave stats: ${errorText}`);
            // Continue loading other data
          }
        } catch (err) {
          console.error('Error fetching leave stats:', err);
          setError('Failed to fetch leave stats due to a network or server error');
          // Continue loading other data
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8081/api/leaves/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setLeaveRequests(leaveRequests.map(request => 
          request.id === id ? { ...request, status: 'APPROVED' } : request
        ));
        const statsResponse = await fetch('http://localhost:8081/api/leaves/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setLeaveStats(statsData);
        }
        const dashboardResponse = await fetch(`http://localhost:8081/api/hr/department-metrics/${departmentData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (dashboardResponse.ok) {
          const data = await dashboardResponse.json();
          setOverallData({
            totalEmployees: data.totalEmployees || 0,
            onLeaveToday: data.onLeaveToday || 0,
            presentToday: (data.totalEmployees || 0) - (data.onLeaveToday || 0)
          });
        }
        setSuccessMessage('Leave approved successfully');
      } else {
        setError('Failed to approve leave');
      }
    } catch (err) {
      setError('Failed to approve leave');
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8081/api/leaves/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setLeaveRequests(leaveRequests.map(request => 
          request.id === id ? { ...request, status: 'REJECTED' } : request
        ));
        const statsResponse = await fetch('http://localhost:8081/api/leaves/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setLeaveStats(statsData);
        }
        const dashboardResponse = await fetch(`http://localhost:8081/api/hr/department-metrics/${departmentData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (dashboardResponse.ok) {
          const data = await dashboardResponse.json();
          setOverallData({
            totalEmployees: data.totalEmployees || 0,
            onLeaveToday: data.onLeaveToday || 0,
            presentToday: (data.totalEmployees || 0) - (data.onLeaveToday || 0)
          });
        }
        setSuccessMessage('Leave rejected successfully');
      } else {
        setError('Failed to reject leave');
      }
    } catch (err) {
      setError('Failed to reject leave');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  const isNonWorkingDay = (date) => {
    const day = new Date(date);
    if (isNaN(day.getTime())) return false;
    const dayOfWeek = day.getDay();
    if (dayOfWeek === 0) return true;
    if (dayOfWeek === 6) {
      const dayOfMonth = day.getDate();
      const weekOfMonth = Math.floor((dayOfMonth - 1) / 7) + 1;
      return weekOfMonth === 2 || weekOfMonth === 4;
    }
    return false;
  };

  const calculateLeaveDays = (startDate, endDate, leaveType) => {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return 0;

    if (leaveType === 'HALF_DAY_CL' || leaveType === 'HALF_DAY_EL' || leaveType === 'HALF_DAY_LWP') {
      if (isNonWorkingDay(startDate)) {
        return 0;
      }
      return 0.5;
    }
    if (leaveType === 'ML') {
      return 182;
    }
    if (leaveType === 'PL') {
      return 15;
    }
    if (!endDate) return 0;

    const end = new Date(endDate);
    if (isNaN(end.getTime())) return 0;

    let currentDate = new Date(startDate);
    let days = 0;

    const countHolidays = leaveType === 'EL' || leaveType === 'ML' || leaveType === 'PL';
    while (currentDate <= end) {
      if (countHolidays || !isNonWorkingDay(currentDate)) {
        days += 1;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  const calculateEndDate = (startDate, leaveType) => {
    if (!startDate) return '';
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return '';
    if (leaveType === 'ML') {
      start.setDate(start.getDate() + 181);
    } else if (leaveType === 'PL') {
      start.setDate(start.getDate() + 14);
    } else {
      return leaveFormData.endDate;
    }
    return start.toISOString().split('T')[0];
  };

  const hasOverlappingLeaves = (startDate, endDate, leaveType) => {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return false;
    const newStart = start;
    const newEnd = (leaveType === 'HALF_DAY_CL' || leaveType === 'HALF_DAY_EL' || leaveType === 'HALF_DAY_LWP') ? new Date(startDate) : new Date(endDate);
    if (isNaN(newEnd.getTime())) return false;

    return myLeaveRequests.some((application) => {
      if (application.status === 'REJECTED') return false;

      const existingStart = new Date(application.startDate);
      const existingEnd = (application.leaveType === 'HALF_DAY_CL' || application.leaveType === 'HALF_DAY_EL' || application.leaveType === 'HALF_DAY_LWP')
        ? new Date(application.startDate)
        : new Date(application.endDate);

      if (isNaN(existingStart.getTime()) || isNaN(existingEnd.getTime())) return false;

      return existingStart <= newEnd && existingEnd >= newStart;
    });
  };

  useEffect(() => {
    if (leaveFormData.startDate && (leaveFormData.leaveType === 'ML' || leaveFormData.leaveType === 'PL')) {
      const calculatedEndDate = calculateEndDate(leaveFormData.startDate, leaveFormData.leaveType);
      setLeaveFormData((prev) => ({ ...prev, endDate: calculatedEndDate }));
    }
    if (leaveFormData.startDate) {
      const days = calculateLeaveDays(
        leaveFormData.startDate,
        leaveFormData.endDate,
        leaveFormData.leaveType
      );
      setLeaveDays(days);
    } else {
      setLeaveDays(0);
    }
  }, [leaveFormData.startDate, leaveFormData.endDate, leaveFormData.leaveType]);

  const handleLeaveSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    if (leaveFormData.startDate && leaveFormData.startDate < today) {
      setError('Start date cannot be in the past.');
      setIsSubmitting(false);
      return;
    }

    if (!leaveFormData.startDate || !leaveFormData.reason) {
      setError('Please fill all required fields (Start Date and Reason).');
      setIsSubmitting(false);
      return;
    }

    if (leaveFormData.leaveType !== 'HALF_DAY_CL' && leaveFormData.leaveType !== 'HALF_DAY_EL' && leaveFormData.leaveType !== 'HALF_DAY_LWP' && leaveFormData.leaveType !== 'ML' && leaveFormData.leaveType !== 'PL' && !leaveFormData.endDate) {
      setError('Please provide an end date for this leave type.');
      setIsSubmitting(false);
      return;
    }

    if (leaveFormData.endDate && new Date(leaveFormData.endDate) < new Date(leaveFormData.startDate)) {
      setError('End date cannot be earlier than start date.');
      setIsSubmitting(false);
      return;
    }

    if ((leaveFormData.leaveType === 'HALF_DAY_CL' || leaveFormData.leaveType === 'HALF_DAY_EL' || leaveFormData.leaveType === 'HALF_DAY_LWP') && isNonWorkingDay(leaveFormData.startDate)) {
      setError('Half-day leave cannot be applied on a non-working day (second/fourth Saturday or Sunday).');
      setIsSubmitting(false);
      return;
    }

    const leaveDays = calculateLeaveDays(leaveFormData.startDate, leaveFormData.endDate, leaveFormData.leaveType);

    if (leaveDays === 0) {
      setError('No working days selected for leave. Please choose valid dates.');
      setIsSubmitting(false);
      return;
    }

    const endDateForOverlap = (leaveFormData.leaveType === 'HALF_DAY_CL' || leaveFormData.leaveType === 'HALF_DAY_EL' || leaveFormData.leaveType === 'HALF_DAY_LWP')
      ? leaveFormData.startDate
      : leaveFormData.endDate;
    if (hasOverlappingLeaves(leaveFormData.startDate, endDateForOverlap, leaveFormData.leaveType)) {
      setError(`You already have a pending or approved leave overlapping with the dates ${formatDate(leaveFormData.startDate)} to ${formatDate(endDateForOverlap)}.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('authToken');
        navigate('/');
        setIsSubmitting(false);
        return;
      }

      const leaveTypeMap = {
        CL: 'casualLeave',
        EL: 'earnedLeave',
        ML: 'maternityLeave',
        PL: 'paternityLeave',
        HALF_DAY_CL: 'casualLeave',
        HALF_DAY_EL: 'earnedLeave',
        LWP: 'leaveWithoutPay',
        HALF_DAY_LWP: 'leaveWithoutPay'
      };

      const leaveKey = leaveTypeMap[leaveFormData.leaveType];
      const remainingLeaves = leaveBalance[leaveKey]?.remaining || 0;

      if (remainingLeaves < leaveDays) {
        setError(`You may not have enough ${leaveKey.replace(/([A-Z])/g, ' $1').toLowerCase()} for this request. Remaining: ${remainingLeaves}. The application will still be submitted for approval.`);
      }

      const endDate = (leaveFormData.leaveType === 'HALF_DAY_CL' || leaveFormData.leaveType === 'HALF_DAY_EL' || leaveFormData.leaveType === 'HALF_DAY_LWP')
        ? leaveFormData.startDate
        : leaveFormData.endDate;

      const response = await fetch('http://localhost:8081/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          leaveType: leaveFormData.leaveType,
          startDate: leaveFormData.startDate,
          endDate,
          reason: leaveFormData.reason,
          isHalfDay: leaveFormData.leaveType === 'HALF_DAY_CL' || leaveFormData.leaveType === 'HALF_DAY_EL' || leaveFormData.leaveType === 'HALF_DAY_LWP'
        })
      });

      if (response.ok) {
        setSuccessMessage(`Leave application submitted successfully! Awaiting approval from ${userData?.reportingTo?.fullName || 'your reporting manager'}.`);
        setLeaveFormData({
          leaveType: 'CL',
          startDate: '',
          endDate: '',
          reason: '',
          isHalfDay: false
        });
        setLeaveDays(0);
        setActiveView('my-leaves');

        const myLeaveResponse = await fetch('http://localhost:8081/api/leaves', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (myLeaveResponse.ok) {
          const myLeaveData = await myLeaveResponse.json();
          setMyLeaveRequests(myLeaveData);
        }

        const balanceResponse = await fetch('http://localhost:8081/api/leaves/balance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          const sanitizedBalance = {
            casualLeave: balanceData.casualLeave || { total: 12, used: 0, remaining: 12 },
            earnedLeave: balanceData.earnedLeave || { total: 20, used: 0, remaining: 20 },
            maternityLeave: balanceData.maternityLeave || { total: 182, used: 0, remaining: 182 },
            paternityLeave: balanceData.paternityLeave || { total: 15, used: 0, remaining: 15 },
            leaveWithoutPay: balanceData.leaveWithoutPay || { total: 300, used: 0, remaining: 300 }
          };
          Object.keys(sanitizedBalance).forEach((key) => {
            sanitizedBalance[key].used = Number(sanitizedBalance[key].used.toFixed(1));
            sanitizedBalance[key].remaining = Number(sanitizedBalance[key].remaining.toFixed(1));
          });
          setLeaveBalance(sanitizedBalance);
        }
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.message || 'Failed to submit leave application.';
        // Parse specific backend errors for better user feedback
        if (errorMessage.includes('Insufficient')) {
          errorMessage = errorMessage.replace('Insufficient', 'Not enough remaining');
        } else if (errorMessage.includes('overlapping')) {
          const match = errorMessage.match(/from (\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/);
          if (match) {
            errorMessage = `You have an overlapping leave from ${formatDate(match[1])} to ${formatDate(match[2])}. Please adjust your dates.`;
          }
        } else if (errorMessage.includes('Half-day leave cannot be applied')) {
          errorMessage = 'Half-day leave cannot be applied on a non-working day (second/fourth Saturday or Sunday).';
        }
        setError(errorMessage);
      }
    } catch (err) {
      setError('An error occurred while submitting the application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50';
      case 'APPROVED':
        return 'text-green-600 bg-green-50';
      case 'REJECTED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const leaveTypeMap = {
    CL: 'casualLeave',
    EL: 'earnedLeave',
    ML: 'maternityLeave',
    PL: 'paternityLeave',
    HALF_DAY_CL: 'casualLeave',
    HALF_DAY_EL: 'earnedLeave',
    LWP: 'leaveWithoutPay',
    HALF_DAY_LWP: 'leaveWithoutPay'
  };

  const isLeaveTypeAvailable = (leaveType) => {
    const leaveKey = leaveTypeMap[leaveType];
    return leaveBalance[leaveKey]?.remaining > 0;
  };

  const getRemainingLeavesForType = (leaveType) => {
    const leaveKey = leaveTypeMap[leaveType];
    return leaveBalance[leaveKey]?.remaining || 0;
  };

  const totalRemainingLeaves = Number(
    (leaveBalance.casualLeave.remaining + leaveBalance.earnedLeave.remaining).toFixed(1)
  );

  const metrics = [
    { key: 'total-employees', title: 'Total Employees', value: overallData.totalEmployees, borderColor: 'border-blue-500', icon: <Users size={24} className="text-blue-500" /> },
    { key: 'present-today', title: 'Present Today', value: overallData.presentToday, borderColor: 'border-green-500', icon: <UserCheck size={24} className="text-green-500" /> },
    { key: 'on-leave-today', title: 'On Leave Today', value: overallData.onLeaveToday, borderColor: 'border-red-500', icon: <UserMinus size={24} className="text-red-500" /> },
  ];

  const leaveBalanceMetrics = [
    {
      key: 'total-leave-balance',
      title: 'Total Leave Balance (CL + EL)',
      value: totalRemainingLeaves,
      borderColor: 'border-purple-500',
      icon: <User size={24} className="text-purple-500" />,
      details: [
        { label: 'Total Remaining', value: totalRemainingLeaves }
      ]
    },
    {
      key: 'casual-leave',
      title: 'Casual Leave (CL)',
      borderColor: 'border-blue-500',
      icon: <CalendarCheck size={24} className="text-blue-500" />,
      details: [
        { label: 'Total Annual', value: leaveBalance.casualLeave.total },
        { label: 'Used', value: leaveBalance.casualLeave.used.toFixed(1), textColor: 'text-red-600' },
        { label: 'Remaining', value: leaveBalance.casualLeave.remaining.toFixed(1), textColor: 'text-green-600' }
      ]
    },
    {
      key: 'earned-leave',
      title: 'Earned Leave (EL)',
      borderColor: 'border-green-500',
      icon: <Calendar size={24} className="text-green-500" />,
      details: [
        { label: 'Total Annual', value: leaveBalance.earnedLeave.total },
        { label: 'Used', value: leaveBalance.earnedLeave.used.toFixed(1), textColor: 'text-red-600' },
        { label: 'Remaining', value: leaveBalance.earnedLeave.remaining.toFixed(1), textColor: 'text-green-600' }
      ]
    },
    ...(userData?.gender?.toUpperCase() === 'MALE' ? [{
      key: 'paternity-leave',
      title: 'Paternity Leave (PL)',
      borderColor: 'border-blue-500',
      icon: <Calendar size={24} className="text-blue-500" />,
      details: [
        { label: 'Total', value: leaveBalance.paternityLeave.total },
        { label: 'Used', value: leaveBalance.paternityLeave.used.toFixed(1), textColor: 'text-red-600' },
        { label: 'Remaining', value: leaveBalance.paternityLeave.remaining.toFixed(1), textColor: 'text-green-600' }
      ]
    }] : []),
    {
      key: 'leave-without-pay',
      title: 'Leave Without Pay (LWP)',
      borderColor: 'border-gray-500',
      icon: <Calendar size={24} className="text-gray-500" />,
      details: [
        { label: 'Total Annual', value: leaveBalance.leaveWithoutPay.total },
        { label: 'Used', value: leaveBalance.leaveWithoutPay.used.toFixed(1), textColor: 'text-red-600' },
        { label: 'Remaining', value: leaveBalance.leaveWithoutPay.remaining.toFixed(1), textColor: 'text-green-600' }
      ]
    }
  ];

  const renderDashboardView = () => {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Department Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map(metric => (
              <div
                key={metric.key}
                className={`bg-white rounded-lg p-5 border-l-4 ${metric.borderColor} shadow-md hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-center space-x-3">
                  {metric.icon}
                  <div>
                    <div className="text-sm font-medium text-gray-600">{metric.title}</div>
                    <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Leave Balance Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaveBalanceMetrics.map(metric => (
              <div
                key={metric.key}
                className={`bg-white rounded-lg p-5 border-l-4 ${metric.borderColor} shadow-md hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">{metric.title}</h3>
                  {metric.icon}
                </div>
                <div className="space-y-3">
                  {metric.details.map((detail, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600">{detail.label}</span>
                      <span className={`font-bold text-xl ${detail.textColor || 'text-gray-900'}`}>
                        {detail.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderApplyLeaveView = () => {
    const isHalfDay = leaveFormData.leaveType === 'HALF_DAY_CL' || leaveFormData.leaveType === 'HALF_DAY_EL' || leaveFormData.leaveType === 'HALF_DAY_LWP';
    const isFixedDuration = leaveFormData.leaveType === 'ML' || leaveFormData.leaveType === 'PL';

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Apply for Leave</h2>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={leaveFormData.leaveType}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, leaveType: e.target.value, isHalfDay: e.target.value.includes('HALF_DAY') })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="off"
                >
                  <option value="CL" disabled={!isLeaveTypeAvailable('CL')}>
                    Casual Leave {isLeaveTypeAvailable('CL') ? '' : '(Unavailable)'}
                  </option>
                  <option value="EL" disabled={!isLeaveTypeAvailable('EL')}>
                    Earned Leave {isLeaveTypeAvailable('EL') ? '' : '(Unavailable)'}
                  </option>
                  <option value="HALF_DAY_CL" disabled={!isLeaveTypeAvailable('HALF_DAY_CL')}>
                    Half-Day CL {isLeaveTypeAvailable('HALF_DAY_CL') ? '' : '(Unavailable)'}
                  </option>
                  <option value="HALF_DAY_EL" disabled={!isLeaveTypeAvailable('HALF_DAY_EL')}>
                    Half-Day EL {isLeaveTypeAvailable('HALF_DAY_EL') ? '' : '(Unavailable)'}
                  </option>
                  {userData?.gender?.toUpperCase() === 'FEMALE' && (
                    <option value="ML" disabled={!isLeaveTypeAvailable('ML')}>
                      Maternity Leave {isLeaveTypeAvailable('ML') ? '' : '(Unavailable)'}
                    </option>
                  )}
                  {userData?.gender?.toUpperCase() === 'MALE' && (
                    <option value="PL" disabled={!isLeaveTypeAvailable('PL')}>
                      Paternity Leave {isLeaveTypeAvailable('PL') ? '' : '(Unavailable)'}
                    </option>
                  )}
                  <option value="LWP" disabled={!isLeaveTypeAvailable('LWP')}>
                    Leave Without Pay (LWP) {isLeaveTypeAvailable('LWP') ? '' : '(Unavailable)'}
                  </option>
                  <option value="HALF_DAY_LWP" disabled={!isLeaveTypeAvailable('HALF_DAY_LWP')}>
                    Half-Day LWP {isLeaveTypeAvailable('HALF_DAY_LWP') ? '' : '(Unavailable)'}
                  </option>
                </select>
                <p className="text-sm text-gray-600 mt-1">
                  Remaining: {getRemainingLeavesForType(leaveFormData.leaveType).toFixed(1)} days (deducted upon approval)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={leaveFormData.startDate}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, startDate: e.target.value })}
                    min={today}
                    className={`pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${leaveFormData.startDate && leaveFormData.startDate < today ? 'border-red-500 bg-red-50' : ''}`}
                    autoComplete="off"
                  />
                </div>
                {leaveFormData.startDate && leaveFormData.startDate < today && (
                  <div className="text-red-600 text-sm mt-1">
                    Past dates are not allowed.
                  </div>
                )}
              </div>
              {!isHalfDay && !isFixedDuration && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={leaveFormData.endDate}
                      onChange={(e) =>
                        setLeaveFormData({ ...leaveFormData, endDate: e.target.value })
                      }
                      min={leaveFormData.startDate || today}
                      className={`pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        leaveFormData.endDate &&
                        leaveFormData.startDate &&
                        leaveFormData.endDate < leaveFormData.startDate
                          ? 'border-red-500 bg-red-50'
                          : ''
                      }`}
                      autoComplete="off"
                    />
                  </div>
                  {leaveFormData.endDate &&
                    leaveFormData.startDate &&
                    leaveFormData.endDate < leaveFormData.startDate && (
                      <div className="text-red-600 text-sm mt-1">
                        End date cannot be before start date.
                      </div>
                    )}
                </div>
              )}
              {isFixedDuration && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={leaveFormData.endDate}
                      readOnly
                      className="pl-10 w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {leaveFormData.leaveType === 'ML'
                      ? 'Maternity leave is fixed at 182 days.'
                      : 'Paternity leave is fixed at 15 days.'}
                  </p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={leaveFormData.reason}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="off"
                ></textarea>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Total leave days (excluding second/fourth Saturdays and Sundays for CL and LWP): <span className="font-bold">{leaveDays.toFixed(1)}</span>
              </p>
            </div>
            <button
              onClick={handleLeaveSubmit}
              disabled={
                isSubmitting ||
                !isLeaveTypeAvailable(leaveFormData.leaveType) ||
                !leaveFormData.startDate ||
                !leaveFormData.reason ||
                ((leaveFormData.leaveType !== 'HALF_DAY_CL' && leaveFormData.leaveType !== 'HALF_DAY_EL' && leaveFormData.leaveType !== 'HALF_DAY_LWP' && leaveFormData.leaveType !== 'ML' && leaveFormData.leaveType !== 'PL') && !leaveFormData.endDate) ||
                (leaveFormData.startDate && leaveFormData.startDate < today) ||
                (leaveFormData.endDate && leaveFormData.startDate && leaveFormData.endDate < leaveFormData.startDate && leaveFormData.leaveType !== 'ML' && leaveFormData.leaveType !== 'PL') ||
                leaveDays === 0
              }
              className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isSubmitting || !isLeaveTypeAvailable(leaveFormData.leaveType) || !leaveFormData.startDate || !leaveFormData.reason || leaveDays === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMyLeavesView = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">My Leave Applications</h2>
        <div className="bg-white rounded-lg shadow-lg p-6">
          {isLoading ? (
            <div className="text-center py-6">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : myLeaveRequests.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-600">You have not applied for any leaves yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Start Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">End Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Applied On</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Remaining Leaves</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Half-Day</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeaveRequests.map((request) => {
                    const leaveKey = leaveTypeMap[request.leaveType] || 'leaveWithoutPay';
                    const remainingLeaves = leaveBalance[leaveKey]?.remaining || 0;
                    return (
                      <tr key={request.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{request.id}</td>
                        <td className="py-3 px-4">{request.leaveType}</td>
                        <td className="py-3 px-4">{formatDate(request.startDate)}</td>
                        <td className="py-3 px-4">{request.isHalfDay ? `${formatDate(request.startDate)} (Half-Day)` : request.endDate ? formatDate(request.endDate) : 'N/A'}</td>
                        <td className="py-3 px-4">{request.reason}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{request.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">{formatDate(request.appliedOn)}</td>
                        <td className="py-3 px-4">{remainingLeaves.toFixed(1)}</td>
                        <td className="py-3 px-4">{request.isHalfDay ? 'Yes' : 'No'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSubordinateLeavesView = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Pending Subordinate Leave Requests</h2>
        <div className="bg-white rounded-lg shadow-lg p-6">
          {isLoading ? (
            <div className="text-center py-6">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-600">No pending subordinate leave requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Start Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">End Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Applied On</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Remaining Leaves</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Half-Day</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{request.id}</td>
                      <td className="py-3 px-4">{request.userName}</td>
                      <td className="py-3 px-4">{request.leaveType}</td>
                      <td className="py-3 px-4">{formatDate(request.startDate)}</td>
                      <td className="py-3 px-4">{request.isHalfDay ? `${formatDate(request.startDate)} (Half-Day)` : request.endDate ? formatDate(request.endDate) : 'N/A'}</td>
                      <td className="py-3 px-4">{request.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">{formatDate(request.appliedOn)}</td>
                      <td className="py-3 px-4">{request.remainingLeaves != null ? request.remainingLeaves.toFixed(1) : 'N/A'}</td>
                      <td className="py-3 px-4">{request.isHalfDay ? 'Yes' : 'No'}</td>
                      <td className="py-3 px-4">
                        {request.status === 'PENDING' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="p-2 bg-green-100 rounded-full hover:bg-green-200"
                            >
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="p-2 bg-red-100 rounded-full hover:bg-red-200"
                            >
                              <XCircle className="h-5 w-5 text-red-600" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmployeesView = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Employees in {departmentData?.name || 'Department'}</h2>
        <div className="bg-white rounded-lg shadow-lg p-6">
          {isLoading ? (
            <div className="text-center py-6">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : error && error.includes('fetch department employees') ? (
            <div className="text-center py-6">
              <p className="text-red-600">Unable to load employees at this time.</p>
            </div>
          ) : employeesInDepartment.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-600">No employees found in this department.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Employee Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Position</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeesInDepartment.map(employee => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{employee.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{employee.position}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M12 2a10 10 0 0110 10 10 10 0 01-10 10 10 10 0 01-10-10 10 10 0 0110-10zM12 4a8 8 0 00-8 8 8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8z"></path>
          </svg>
        </div>
      );
    }

    // Only block rendering if the error is critical (e.g., session expired or department not found)
    if (error && (error.includes('Session expired') || error.includes('Access denied') || error.includes('department was not found') || error.includes('permission to access'))) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return renderDashboardView();
      case 'apply-leave':
        return renderApplyLeaveView();
      case 'my-leaves':
        return renderMyLeavesView();
      case 'subordinate-leaves':
        return renderSubordinateLeavesView();
      case 'employees':
        return renderEmployeesView();
      default:
        return renderDashboardView();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-blue-900 text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out shadow-lg`}>
        <div className="flex items-center justify-between p-4 border-b border-blue-800">
          <div className="flex items-center space-x-3">
            <img src="/Images/bisag_logo.png" alt="BISAG-N Logo" className="h-10 w-10 rounded-full" />
            <span className="text-xl font-semibold">BISAG-N HRMS</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${
              activeView === 'dashboard' ? 'bg-blue-800' : 'hover:bg-blue-800'
            }`}
          >
            <Users size={20} className="mr-3" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveView('apply-leave')}
            className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${
              activeView === 'apply-leave' ? 'bg-blue-800' : 'hover:bg-blue-800'
            }`}
          >
            <PlusCircle size={20} className="mr-3" />
            Apply for Leave
          </button>
          <button
            onClick={() => setActiveView('my-leaves')}
            className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${
              activeView === 'my-leaves' ? 'bg-blue-800' : 'hover:bg-blue-800'
            }`}
          >
            <FileText size={20} className="mr-3" />
            My Leave Applications
          </button>
          <button
            onClick={() => setActiveView('subordinate-leaves')}
            className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${
              activeView === 'subordinate-leaves' ? 'bg-blue-800' : 'hover:bg-blue-800'
            }`}
          >
            <Clock size={20} className="mr-3" />
            Subordinate Leave Requests
          </button>
          <button
            onClick={() => setActiveView('employees')}
            className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${
              activeView === 'employees' ? 'bg-blue-800' : 'hover:bg-blue-800'
            }`}
          >
            <Users size={20} className="mr-3" />
            Employees in Department
          </button>
          <button onClick={handleLogout} className="flex items-center w-full p-3 text-left rounded-lg hover:bg-red-600 transition duration-200">
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="bg-white shadow-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden mr-4">
              <Menu size={24} className="text-gray-700" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Project Manager Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Welcome, {userData?.fullName || 'User'}</span>
            <img src="/Images/bisag_logo.png" alt="BISAG-N Logo" className="h-8 w-8 rounded-full" />
          </div>
        </header>

        <main className="flex-1 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 shadow-sm">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 shadow-sm">
              <p className="text-sm text-green-800 font-medium">{successMessage}</p>
            </div>
          )}
          <div className="space-y-8">
            {renderMainContent()}
          </div>
        </main>

        <footer className="bg-blue-900 text-white py-4 text-center">
          <p className="text-sm">© 2025 BISAG-N. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}