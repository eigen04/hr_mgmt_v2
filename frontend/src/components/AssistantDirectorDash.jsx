import { useState, useEffect } from 'react';
import { Users, Clock, UserCheck, Briefcase, LogOut, Menu, X, ChevronLeft, ChevronRight, Download, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';

export default function AssistantDirectorDash() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [departmentData, setDepartmentData] = useState(null);
  const [employeesInDepartment, setEmployeesInDepartment] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveStats, setLeaveStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [overallData, setOverallData] = useState({
    totalEmployees: 0,
    onLeaveToday: 0,
    projectManagers: 0,
    assistantDirectors: 0,
  });
  const navigate = useNavigate();

  // Fetch user and department data
  useEffect(() => {
    const fetchUserAndDepartmentData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Please log in to continue');
          navigate('/');
          return;
        }

        // Fetch user data
        const userResponse = await fetch('http://localhost:8081/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (userResponse.ok) {
          const user = await userResponse.json();
          if (user.role !== 'ASSISTANT_DIRECTOR') {
            setError('Access denied. This dashboard is for Assistant Directors only.');
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
          setError('Failed to fetch user data');
          return;
        }

        // Fetch department data by name (since user.department is a string)
        const departmentsResponse = await fetch('http://localhost:8081/api/departments', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (departmentsResponse.ok) {
          const departments = await departmentsResponse.json();
          const userDepartment = departments.find(dept => dept.name === userData.department);
          if (userDepartment) {
            setDepartmentData({
              id: userDepartment.id,
              name: userDepartment.name || 'Unnamed Department',
              description: userDepartment.description || '',
              employeeCount: userDepartment.employeeCount || 0,
              onLeaveCount: userDepartment.onLeaveCount || 0,
            });
          } else {
            setError('Your department was not found');
            return;
          }
        } else {
          setError('Failed to fetch department data');
          return;
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndDepartmentData();
  }, [navigate, userData?.department]); // Only depend on userData.department

  // Fetch department metrics, employees, leave requests, and stats after departmentData is available
  useEffect(() => {
    const fetchDepartmentRelatedData = async () => {
      if (!departmentData?.id) return; // Skip if departmentData.id is not available

      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');

        // Fetch department employees
        await fetchEmployeesInDepartment(departmentData.id, token);

        // Fetch leave requests
        const leaveResponse = await fetch('http://localhost:8081/api/leaves/pending', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (leaveResponse.ok) {
          setLeaveRequests(await leaveResponse.json());
        } else {
          setError('Failed to fetch subordinate leave applications');
        }

        // Fetch leave stats
        const statsResponse = await fetch('http://localhost:8081/api/leaves/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (statsResponse.ok) {
          setLeaveStats(await statsResponse.json());
        } else {
          setError('Failed to fetch leave stats');
        }

        // Fetch department metrics
        const dashboardResponse = await fetch(`http://localhost:8081/api/hr/department-metrics/${departmentData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (dashboardResponse.ok) {
          const data = await dashboardResponse.json();
          setOverallData({
            totalEmployees: data.totalEmployees || 0,
            onLeaveToday: data.onLeaveToday || 0,
            projectManagers: data.projectManagers || 0,
            assistantDirectors: data.assistantDirectors || 0,
          });
        } else if (dashboardResponse.status === 403) {
          setError('You do not have permission to access this department’s metrics');
        } else {
          setError('Failed to fetch department metrics');
        }
      } catch (err) {
        setError('Failed to load department-related data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartmentRelatedData();
  }, [departmentData?.id]); // Depend on departmentData.id to trigger this effect

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => setNotification({ message: '', type: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchEmployeesInDepartment = async (deptId, token) => {
    if (!deptId) return; // Prevent fetching if deptId is not available
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:8081/api/hr/departments/${deptId}/employees`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have permission to access this department’s employees');
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const formattedEmployees = data.map(employee => {
        const getDatesInRange = (startDate, endDate) => {
          const dates = [];
          let currentDate = new Date(startDate);
          const end = new Date(endDate);
          if (isNaN(currentDate.getTime()) || isNaN(end.getTime())) {
            return dates;
          }
          while (currentDate <= end) {
            const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            dates.push(formattedDate);
            currentDate.setDate(currentDate.getDate() + 1);
          }
          return dates;
        };

        const mapLeaves = (applications, leaveType) => {
          if (!applications || !Array.isArray(applications)) {
            return [];
          }
          const typeMapping = {
            'CASUAL': 'CASUAL',
            'EARNED': 'EARNED',
            'LWP': 'LWP',
            'PATERNITY': 'PATERNITY',
            'MATERNITY': 'MATERNITY',
            'HALF_DAY_CL': 'HALF_DAY_CL',
            'HALF_DAY_EL': 'HALF_DAY_EL',
            'HALF_DAY_LWP': 'HALF_DAY_LWP',
          };
          const filteredApps = applications.filter(app => {
            const appLeaveType = app.leaveType ? app.leaveType.toUpperCase() : '';
            const normalizedLeaveType = typeMapping[appLeaveType] || appLeaveType;
            return normalizedLeaveType === leaveType && app.status === 'APPROVED';
          });

          const uniqueDates = new Set();
          filteredApps.forEach(app => {
            const dates = getDatesInRange(app.startDate, app.endDate);
            dates.forEach(date => {
              if (['CASUAL', 'LWP', 'HALF_DAY_CL', 'HALF_DAY_LWP'].includes(leaveType)) {
                if (isWorkingDay(date)) {
                  uniqueDates.add(date);
                }
              } else {
                uniqueDates.add(date);
              }
            });
          });

          return Array.from(uniqueDates).map(date => ({
            date,
            isHalfDay: filteredApps.find(app => app.startDate === date)?.isHalfDay || false,
            leaveType: leaveType,
          }));
        };

        return {
          id: employee.id,
          name: employee.fullName || 'Unnamed Employee',
          position: employee.role || 'Employee',
          leaves: {
            casual: mapLeaves(employee.leaveApplications, 'CASUAL'),
            earned: mapLeaves(employee.leaveApplications, 'EARNED'),
            lwp: mapLeaves(employee.leaveApplications, 'LWP'),
            maternity: mapLeaves(employee.leaveApplications, 'MATERNITY'),
            paternity: mapLeaves(employee.leaveApplications, 'PATERNITY'),
            half_day_cl: mapLeaves(employee.leaveApplications, 'HALF_DAY_CL'),
            half_day_el: mapLeaves(employee.leaveApplications, 'HALF_DAY_EL'),
            half_day_lwp: mapLeaves(employee.leaveApplications, 'HALF_DAY_LWP'),
          },
        };
      });

      setEmployeesInDepartment(formattedEmployees);
    } catch (error) {
      setError('Failed to load employee data. Please try again later.');
      setEmployeesInDepartment([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isWorkingDay = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return false;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return false;
    }
    const day = date.getDay();
    const dateOfMonth = date.getDate();
    const weekOfMonth = Math.floor((dateOfMonth - 1) / 7) + 1;
    if (day === 0) return false; // Sunday
    if (day === 6) return !(weekOfMonth === 2 || weekOfMonth === 4); // Second/Fourth Saturday
    return true;
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8081/api/leaves/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setLeaveRequests(leaveRequests.map(request =>
          request.id === id ? { ...request, status: 'APPROVED' } : request
        ));
        const statsResponse = await fetch('http://localhost:8081/api/leaves/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setLeaveStats(statsData);
        }
        setNotification({ message: 'Leave approved successfully', type: 'success' });
      } else {
        setNotification({ message: 'Failed to approve leave', type: 'error' });
      }
    } catch (err) {
      setNotification({ message: 'Failed to approve leave', type: 'error' });
    }
  };

  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8081/api/leaves/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setLeaveRequests(leaveRequests.map(request =>
          request.id === id ? { ...request, status: 'REJECTED' } : request
        ));
        const statsResponse = await fetch('http://localhost:8081/api/leaves/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setLeaveStats(statsData);
        }
        setNotification({ message: 'Leave rejected successfully', type: 'success' });
      } else {
        setNotification({ message: 'Failed to reject leave', type: 'error' });
      }
    } catch (err) {
      setNotification({ message: 'Failed to reject leave', type: 'error' });
    }
  };

  const handleExportExcel = async () => {
    if (!departmentData || !employeesInDepartment.length) {
      setNotification({ message: 'No data available to export.', type: 'error' });
      return;
    }

    try {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const monthRegex = new RegExp(`^${year}-${month}`);

      const reportData = employeesInDepartment.map(employee => {
        const countLeaves = (leaves, leaveType, isHalfDayType = false) => {
          if (!Array.isArray(leaves)) return 0;
          const filteredLeaves = leaves.filter(leave => {
            if (!leave || !leave.date || !leave.leaveType) return false;
            const isInMonth = monthRegex.test(leave.date);
            const shouldCheckWorkingDay = ['CASUAL', 'LWP', 'HALF_DAY_CL', 'HALF_DAY_LWP'].includes(leaveType);
            const isValidDay = shouldCheckWorkingDay ? isWorkingDay(leave.date) : true;
            return isInMonth && isValidDay;
          });
          return filteredLeaves.reduce((total, leave) => {
            return total + (leave.isHalfDay || isHalfDayType ? 0.5 : 1);
          }, 0);
        };

        const casualCount = countLeaves(employee.leaves.casual, 'CASUAL', false);
        const earnedCount = countLeaves(employee.leaves.earned, 'EARNED', false);
        const lwpCount = countLeaves(employee.leaves.lwp, 'LWP', false);
        const maternityCount = countLeaves(employee.leaves.maternity, 'MATERNITY', false);
        const paternityCount = countLeaves(employee.leaves.paternity, 'PATERNITY', false);
        const halfDayClCount = countLeaves(employee.leaves.half_day_cl, 'HALF_DAY_CL', true);
        const halfDayElCount = countLeaves(employee.leaves.half_day_el, 'HALF_DAY_EL', true);
        const halfDayLwpCount = countLeaves(employee.leaves.half_day_lwp, 'HALF_DAY_LWP', true);

        const totalLeaves = casualCount + earnedCount + lwpCount + maternityCount + paternityCount + halfDayClCount + halfDayElCount + halfDayLwpCount;

        return {
          'Employee Name': employee.name,
          'Casual Leave': casualCount,
          'Earned Leave': earnedCount,
          'Leave Without Pay': lwpCount,
          'Maternity Leave': maternityCount,
          'Paternity Leave': paternityCount,
          'Half Day Casual Leave': halfDayClCount,
          'Half Day Earned Leave': halfDayElCount,
          'Half Day Leave Without Pay': halfDayLwpCount,
          'Total Leaves': totalLeaves,
        };
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Leave Report');
      const headers = Object.keys(reportData[0]);
      worksheet.columns = headers.map(header => ({
        header,
        key: header,
        width: header === 'Employee Name' ? 20 : 15,
      }));

      reportData.forEach(data => worksheet.addRow(data));
      const monthName = currentMonth.toLocaleString('default', { month: 'long' });
      const fileName = `${departmentData.name}_Leave_Report_${monthName}_${year}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
      setNotification({ message: 'Leave report exported successfully', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Failed to export leave report.', type: 'error' });
    }
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleMonthChange = (increment) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const backToDepartment = () => {
    setSelectedEmployee(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
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
        return null;
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

  const renderLeaveCalendar = () => {
    if (!selectedEmployee) return null;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const calendarDays = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push({ day: null, leaveType: null, isHalfDay: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      let leaveType = null;
      let isHalfDay = false;

      const casualLeave = selectedEmployee.leaves.casual?.find(leave => leave.date === date);
      const earnedLeave = selectedEmployee.leaves.earned?.find(leave => leave.date === date);
      const lwpLeave = selectedEmployee.leaves.lwp?.find(leave => leave.date === date);
      const maternityLeave = selectedEmployee.leaves.maternity?.find(leave => leave.date === date);
      const paternityLeave = selectedEmployee.leaves.paternity?.find(leave => leave.date === date);
      const halfDayClLeave = selectedEmployee.leaves.half_day_cl?.find(leave => leave.date === date);
      const halfDayElLeave = selectedEmployee.leaves.half_day_el?.find(leave => leave.date === date);
      const halfDayLwpLeave = selectedEmployee.leaves.half_day_lwp?.find(leave => leave.date === date);

      if (halfDayClLeave) {
        leaveType = 'half_day_cl';
        isHalfDay = halfDayClLeave.isHalfDay;
      } else if (halfDayElLeave) {
        leaveType = 'half_day_el';
        isHalfDay = halfDayElLeave.isHalfDay;
      } else if (halfDayLwpLeave) {
        leaveType = 'half_day_lwp';
        isHalfDay = halfDayLwpLeave.isHalfDay;
      } else if (casualLeave) {
        leaveType = 'casual';
        isHalfDay = casualLeave.isHalfDay;
      } else if (earnedLeave) {
        leaveType = 'earned';
        isHalfDay = earnedLeave.isHalfDay;
      } else if (lwpLeave) {
        leaveType = 'lwp';
        isHalfDay = lwpLeave.isHalfDay;
      } else if (maternityLeave) {
        leaveType = 'maternity';
        isHalfDay = maternityLeave.isHalfDay;
      } else if (paternityLeave) {
        leaveType = 'paternity';
        isHalfDay = paternityLeave.isHalfDay;
      }

      calendarDays.push({ day, leaveType, isHalfDay });
    }

    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    const getLeaveColor = (type, isHalfDay) => {
      switch (type) {
        case 'casual':
          return 'bg-yellow-200 border-yellow-500 text-yellow-900';
        case 'earned':
          return 'bg-green-200 border-green-500 text-green-900';
        case 'lwp':
          return 'bg-gray-200 border-gray-500 text-gray-900';
        case 'maternity':
          return 'bg-pink-200 border-pink-500 text-pink-900';
        case 'paternity':
          return 'bg-blue-200 border-blue-500 text-blue-900';
        case 'half_day_cl':
          return 'bg-orange-200 border-orange-500 text-orange-900';
        case 'half_day_el':
          return 'bg-teal-200 border-teal-500 text-teal-900';
        case 'half_day_lwp':
          return 'bg-gray-300 border-gray-600 text-gray-900';
        default:
          return 'bg-white hover:bg-gray-50';
      }
    };

    const getLeaveTooltip = (type, isHalfDay) => {
      switch (type) {
        case 'casual':
          return 'Casual Leave';
        case 'earned':
          return 'Earned Leave';
        case 'lwp':
          return 'Leave Without Pay';
        case 'maternity':
          return 'Maternity Leave';
        case 'paternity':
          return 'Paternity Leave';
        case 'half_day_cl':
          return 'Half Day Casual Leave';
        case 'half_day_el':
          return 'Half Day Earned Leave';
        case 'half_day_lwp':
          return 'Half Day Leave Without Pay';
        default:
          return '';
      }
    };

    const leaveTypes = [
      { type: 'casual', label: 'Casual Leave', bgColor: 'bg-yellow-200', borderColor: 'border-yellow-500' },
      { type: 'earned', label: 'Earned Leave', bgColor: 'bg-green-200', borderColor: 'border-green-500' },
      { type: 'lwp', label: 'Leave Without Pay', bgColor: 'bg-gray-200', borderColor: 'border-gray-500' },
      { type: 'maternity', label: 'Maternity Leave', bgColor: 'bg-pink-200', borderColor: 'border-pink-500' },
      { type: 'paternity', label: 'Paternity Leave', bgColor: 'bg-blue-200', borderColor: 'border-blue-500' },
      { type: 'half_day_cl', label: 'Half Day Casual Leave', bgColor: 'bg-orange-200', borderColor: 'border-orange-500' },
      { type: 'half_day_el', label: 'Half Day Earned Leave', bgColor: 'bg-teal-200', borderColor: 'border-teal-500' },
      { type: 'half_day_lwp', label: 'Half Day Leave Without Pay', bgColor: 'bg-gray-300', borderColor: 'border-gray-600' },
    ];

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">{monthName} {year}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-2 rounded-full hover:bg-gray-100 transition duration-200"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            <button
              onClick={() => handleMonthChange(1)}
              className="p-2 rounded-full hover:bg-gray-100 transition duration-200"
              aria-label="Next month"
            >
              <ChevronRight size={20} className="text-gray-700" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-600 mb-3">
          {daysOfWeek.map(day => (
            <div key={`weekday-${day}`} className="py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={day.day ? `${year}-${monthName}-${day.day}` : `empty-${index}`}
              className={`aspect-square flex items-center justify-center border rounded-sm text-sm font-medium transition-all duration-200 ${
                day.day ? getLeaveColor(day.leaveType, day.isHalfDay) : 'bg-gray-100'
              } ${day.day && (day.leaveType || day.isHalfDay) ? 'cursor-help' : ''}`}
              title={day.day && (day.leaveType || day.isHalfDay) ? getLeaveTooltip(day.leaveType, day.isHalfDay) : ''}
            >
              {day.day || ''}
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {leaveTypes.map(leave => (
            <div key={leave.type} className="flex items-center space-x-2">
              <div className={`w-4 h-4 ${leave.bgColor} border ${leave.borderColor} rounded-sm`}></div>
              <span className="text-sm text-gray-700">{leave.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDepartmentView = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">{departmentData?.name || 'Department'}</h2>
          {departmentData && (
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
            >
              <Download size={16} />
              <span>Export Leave Report</span>
            </button>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Employee Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Action</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEmployeeClick(employee)}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1 transition duration-200"
                      >
                        <span>View Leave Calendar</span>
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderEmployeeView = () => {
    if (!selectedEmployee) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={backToDepartment}
            className="p-2 rounded-full hover:bg-gray-100 transition duration-200"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <h2 className="text-2xl font-semibold text-gray-900">{selectedEmployee.name}'s Leave Calendar</h2>
        </div>
        {renderLeaveCalendar()}
      </div>
    );
  };

  const renderDashboardView = () => {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Department Metrics</h2>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Subordinate Leave Requests</h3>
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
                      <td className="py-3 px-4">{new Date(request.startDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{request.isHalfDay ? 'Half-Day' : request.endDate ? new Date(request.endDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3 px-4">{request.reason}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">{new Date(request.appliedOn).toLocaleDateString()}</td>
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

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      );
    }

    if (selectedEmployee) {
      return renderEmployeeView();
    } else {
      return renderDepartmentView();
    }
  };

  const metrics = [
    { key: 'total-employees', title: 'Total Employees', value: overallData.totalEmployees, borderColor: 'border-blue-500', icon: <Users size={24} className="text-blue-500" /> },
    { key: 'on-leave-today', title: 'On Leave Today', value: overallData.onLeaveToday, borderColor: 'border-red-500', icon: <Clock size={24} className="text-red-500" /> },
    { key: 'total-managers', title: 'Total Managers', value: overallData.projectManagers, borderColor: 'border-green-500', icon: <Briefcase size={24} className="text-green-500" /> },  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
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
        
          <button onClick={handleLogout} className="flex items-center w-full p-3 text-left rounded-lg hover:bg-red-600 transition duration-200">
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </nav>
      </div>

      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="bg-white shadow-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden mr-4">
              <Menu size={24} className="text-gray-700" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Assistant Director Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Welcome, {userData?.fullName}</span>
            <img src="/Images/bisag_logo.png" alt="BISAG-N Logo" className="h-8 w-8 rounded-full" />
          </div>
        </header>

        <main className="flex-1 p-8">
          {notification.message && (
            <div className={`border rounded-lg p-4 mb-8 shadow-sm ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 shadow-sm">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-8">
            {renderDashboardView()}
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