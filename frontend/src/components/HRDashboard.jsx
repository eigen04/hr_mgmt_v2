import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';

export default function HRDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [overallData, setOverallData] = useState({
    totalEmployees: 0,
    onLeaveToday: 0,
    approvedLeaves: 0,
    pendingLeaves: 0,
  });
  const [departmentData, setDepartmentData] = useState([]);
  const [employeesInDepartment, setEmployeesInDepartment] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('role');

    if (!token || role !== 'HR') {
      navigate('/');
      return;
    }

    const fetchUserData = async () => {
      try {
        setTimeout(() => {
          const username = localStorage.getItem('rememberedUsername') || 'Guest';
          setUserData({
            username: username,
            role: 'HR Manager',
            department: localStorage.getItem('department') || 'Human Resources',
          });
        }, 300);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserData({
          username: 'Guest',
          role: 'HR Manager',
          department: 'Human Resources',
        });
      }
    };

    const fetchDepartmentData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('http://localhost:8081/api/hr/departments', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Raw department data:', data);

        const formattedData = data
          .filter(dept => dept.id !== undefined && dept.id !== null)
          .map(dept => ({
            id: dept.id,
            name: dept.name || 'Unnamed Department',
            description: dept.description || '',
            employeeCount: dept.employeeCount || 0,
            onLeaveCount: dept.onLeaveCount || 0,
          }));

        setDepartmentData(formattedData);
      } catch (error) {
        console.error('Error fetching department data:', error);
        setError('Failed to load department data. Please try again later.');
        setDepartmentData([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('http://localhost:8081/api/hr/dashboard-metrics', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Raw dashboard data:', data);

        setOverallData({
          totalEmployees: data.totalEmployees || 0,
          onLeaveToday: data.onLeaveToday || 0,
          approvedLeaves: data.approvedLeaves || 0,
          pendingLeaves: data.pendingLeaves || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard metrics. Please try again later.');
        setOverallData({
          totalEmployees: 0,
          onLeaveToday: 0,
          approvedLeaves: 0,
          pendingLeaves: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    fetchDepartmentData();
    fetchDashboardData();
  }, [navigate]);

  const fetchEmployeesInDepartment = async (deptId) => {
    const token = localStorage.getItem('authToken');
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
        throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw employees data:', JSON.stringify(data, null, 2));

      const formattedEmployees = data.map(employee => {
        const getDatesInRange = (startDate, endDate) => {
          console.log(`Processing date range for ${employee.fullName}: ${startDate} to ${endDate}`);
          const dates = [];
          let currentDate = new Date(startDate);
          const end = new Date(endDate);
          if (isNaN(currentDate.getTime()) || isNaN(end.getTime())) {
            console.error(`Invalid date range: ${startDate} to ${endDate}`);
            return dates;
          }
          while (currentDate <= end) {
            const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            dates.push(formattedDate);
            console.log(`Added date: ${formattedDate}`);
            currentDate.setDate(currentDate.getDate() + 1);
          }
          return dates;
        };

        const mapLeaves = (applications, leaveType) => {
          console.log(`Mapping leaves for ${employee.fullName}, type: ${leaveType}, applications:`, applications);
          if (!applications || !Array.isArray(applications)) {
            console.warn(`No valid leave applications for ${employee.fullName}, type: ${leaveType}`);
            return [];
          }

          const filteredApps = applications.filter(app => {
            const appLeaveType = app.leaveType ? app.leaveType.toUpperCase() : '';
            const typeMapping = {
              'CL': 'CL',
              'CASUAL': 'CL',
              'EL': 'EL',
              'EARNED': 'EL',
              'LWP': 'LWP',
              'PL': 'PATERNITY',
              'ML': 'MATERNITY',
              'HALF_DAY_CL': 'HALF_DAY_CL',
              'HALF_DAY_EL': 'HALF_DAY_EL',
              'HALF_DAY_LWP': 'HALF_DAY_LWP',
            };
            const normalizedLeaveType = typeMapping[appLeaveType] || appLeaveType;
            console.log(`Comparing appLeaveType: ${appLeaveType}, normalized: ${normalizedLeaveType}, target: ${leaveType}, status: ${app.status}`);
            return normalizedLeaveType === leaveType && app.status === 'APPROVED';
          });

          const uniqueDates = new Set();
          filteredApps.forEach(app => {
            const dates = getDatesInRange(app.startDate, app.endDate);
            dates.forEach(date => {
              // Only include working days for CL, LWP, and their half-day variants
              if (['CL', 'LWP', 'HALF_DAY_CL', 'HALF_DAY_LWP'].includes(leaveType)) {
                if (isWorkingDay(date)) {
                  uniqueDates.add(date);
                  console.log(`Including working day ${date} for leave type ${leaveType}`);
                } else {
                  console.log(`Excluding non-working day ${date} for leave type ${leaveType}`);
                }
              } else {
                uniqueDates.add(date);
                console.log(`Including day ${date} for leave type ${leaveType} (no working day check)`);
              }
            });
          });

          const leaveEntries = Array.from(uniqueDates).map(date => ({
            date,
            isHalfDay: leaveType.includes('HALF_DAY'),
            leaveType: leaveType,
          }));

          console.log(`Unique leave entries for ${employee.fullName}, type: ${leaveType}:`, leaveEntries);
          return leaveEntries;
        };

        const employeeLeaves = {
          cl: mapLeaves(employee.leaveApplications, 'CL'),
          el: mapLeaves(employee.leaveApplications, 'EL'),
          lwp: mapLeaves(employee.leaveApplications, 'LWP'),
          maternity: mapLeaves(employee.leaveApplications, 'MATERNITY'),
          paternity: mapLeaves(employee.leaveApplications, 'PATERNITY'),
          half_day_cl: mapLeaves(employee.leaveApplications, 'HALF_DAY_CL'),
          half_day_el: mapLeaves(employee.leaveApplications, 'HALF_DAY_EL'),
          half_day_lwp: mapLeaves(employee.leaveApplications, 'HALF_DAY_LWP'),
        };
        console.log(`Employee ${employee.fullName} leaves:`, JSON.stringify(employeeLeaves, null, 2));

        return {
          id: employee.id,
          name: employee.fullName || 'Unnamed Employee',
          position: employee.role || 'Employee',
          leaves: employeeLeaves,
        };
      });

      setEmployeesInDepartment(formattedEmployees);
    } catch (error) {
      console.error('Error fetching employees in department:', error);
      setError('Failed to load employee data. Please try again later.');
      setEmployeesInDepartment([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isWorkingDay = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.error(`Invalid date format: ${dateStr}`);
      return false;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error(`Invalid date: ${dateStr}`);
      return false;
    }
    const day = date.getDay();
    const dateOfMonth = date.getDate();
    const weekOfMonth = Math.floor((dateOfMonth - 1) / 7) + 1;
    if (day === 0) {
      console.log(`Excluding ${dateStr}: Sunday (Day=${day}, Date=${dateOfMonth}, WeekOfMonth=${weekOfMonth})`);
      return false;
    }
    if (day === 6) {
      const isSecondOrFourthSaturday = weekOfMonth === 2 || weekOfMonth === 4;
      console.log(`Checking ${dateStr}: Saturday (Day=${day}, Date=${dateOfMonth}, WeekOfMonth=${weekOfMonth}, Excluded=${isSecondOrFourthSaturday})`);
      return !isSecondOrFourthSaturday;
    }
    console.log(`Including ${dateStr}: Working day (Day=${day}, Date=${dateOfMonth}, WeekOfMonth=${weekOfMonth})`);
    return true;
  };

  const handleExportExcel = async (deptId) => {
    const dept = departmentData.find(d => d.id === deptId);
    if (!dept || !employeesInDepartment.length) {
      alert('No data available to export.');
      return;
    }

    try {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const monthRegex = new RegExp(`^${year}-${month}`);

      const reportData = employeesInDepartment.map(employee => {
        const countLeaves = (leaves, leaveType, isHalfDayType = false) => {
          if (!Array.isArray(leaves)) {
            console.warn(`Leaves array is invalid for ${employee.name}, type: ${leaveType}`);
            return 0;
          }
          const filteredLeaves = leaves.filter(leave => {
            if (!leave || !leave.date || !leave.leaveType) {
              console.warn(`Invalid leave entry for ${employee.name}:`, leave);
              return false;
            }
            const isInMonth = monthRegex.test(leave.date);
            const shouldCheckWorkingDay = ['CL', 'HALF_DAY_CL', 'LWP', 'HALF_DAY_LWP'].includes(leaveType);
            const isValidDay = shouldCheckWorkingDay ? isWorkingDay(leave.date) : true;
            console.log(`Evaluating leave for ${employee.name}, date: ${leave.date}, type: ${leaveType}, inMonth: ${isInMonth}, isWorkingDay: ${isValidDay}`);
            return isInMonth && isValidDay;
          });
          return filteredLeaves.reduce((total, leave) => {
            const value = leave.isHalfDay || isHalfDayType ? 0.5 : 1;
            console.log(`Counting leave for ${employee.name}, date: ${leave.date}, type: ${leave.leaveType}, isHalfDay: ${leave.isHalfDay}, value: ${value}, running total: ${total + value}`);
            return total + value;
          }, 0);
        };

        const clCount = countLeaves(employee.leaves.cl, 'CL', false);
        const elCount = countLeaves(employee.leaves.el, 'EL', false);
        const lwpCount = countLeaves(employee.leaves.lwp, 'LWP', false);
        const maternityCount = countLeaves(employee.leaves.maternity, 'MATERNITY', false);
        const paternityCount = countLeaves(employee.leaves.paternity, 'PATERNITY', false);
        const halfDayClCount = countLeaves(employee.leaves.half_day_cl, 'HALF_DAY_CL', true);
        const halfDayElCount = countLeaves(employee.leaves.half_day_el, 'HALF_DAY_EL', true);
        const halfDayLwpCount = countLeaves(employee.leaves.half_day_lwp, 'HALF_DAY_LWP', true);

        const totalLeaves = clCount + elCount + lwpCount + maternityCount + paternityCount + halfDayClCount + halfDayElCount + halfDayLwpCount;

        console.log(`Exporting for ${employee.name}: CL=${clCount}, EL=${elCount}, LWP=${lwpCount}, Maternity=${maternityCount}, Paternity=${paternityCount}, HalfDayCL=${halfDayClCount}, HalfDayEL=${halfDayElCount}, HalfDayLWP=${halfDayLwpCount}, Total=${totalLeaves}`);

        return {
          'Employee Name': employee.name,
          'Casual Leave': clCount,
          'Earned Leave': elCount,
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

      // Add headers
      const headers = Object.keys(reportData[0]);
      worksheet.columns = headers.map(header => ({
        header,
        key: header,
        width: header === 'Employee Name' ? 20 : 15,
      }));

      // Add rows
      reportData.forEach(data => {
        worksheet.addRow(data);
      });

      // Generate file name
      const monthName = currentMonth.toLocaleString('default', { month: 'long' });
      const fileName = `${dept.name}_Leave_Report_${monthName}_${year}.xlsx`;

      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting Excel file:', error);
      alert('Failed to export leave report. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('department');
    navigate('/');
  };

  const handleDepartmentClick = (deptId) => {
    if (!deptId) {
      console.warn('Invalid department ID:', deptId);
      return;
    }
    setSelectedDepartment(deptId);
    setSelectedEmployee(null);
    fetchEmployeesInDepartment(deptId);
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleMonthChange = (increment) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const backToOverview = () => {
    setSelectedDepartment(null);
    setSelectedEmployee(null);
    setEmployeesInDepartment([]);
  };

  const backToDepartment = () => {
    setSelectedEmployee(null);
  };

  const generateCalendarDays = () => {
    if (!selectedEmployee) return [];

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

      const clLeave = selectedEmployee.leaves.cl?.find(leave => leave.date === date);
      const elLeave = selectedEmployee.leaves.el?.find(leave => leave.date === date);
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
      } else if (clLeave) {
        leaveType = 'cl';
        isHalfDay = clLeave.isHalfDay;
      } else if (elLeave) {
        leaveType = 'el';
        isHalfDay = elLeave.isHalfDay;
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

      console.log(`Calendar day ${date} for ${selectedEmployee.name}: leaveType=${leaveType}, isHalfDay=${isHalfDay}`);
      calendarDays.push({ day, leaveType, isHalfDay });
    }

    return calendarDays;
  };

  const renderLeaveCalendar = () => {
    const calendarDays = generateCalendarDays();
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    const year = currentMonth.getFullYear();

    const getLeaveColor = (type, isHalfDay) => {
      switch (type) {
        case 'cl':
          return 'bg-yellow-100 border-yellow-400 text-yellow-800';
        case 'el':
          return 'bg-green-100 border-green-400 text-green-800';
        case 'lwp':
          return 'bg-gray-100 border-gray-400 text-gray-800';
        case 'maternity':
          return 'bg-pink-100 border-pink-400 text-pink-800';
        case 'paternity':
          return 'bg-blue-100 border-blue-400 text-blue-800';
        case 'half_day_cl':
          return 'bg-orange-100 border-orange-400 text-orange-800';
        case 'half_day_el':
          return 'bg-teal-100 border-teal-400 text-teal-800';
        case 'half_day_lwp':
          return 'bg-gray-300 border-gray-600 text-gray-900';
        default:
          return 'bg-white hover:bg-gray-50';
      }
    };

    const getLeaveTooltip = (type, isHalfDay) => {
      switch (type) {
        case 'cl':
          return 'Casual Leave';
        case 'el':
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
      { type: 'cl', label: 'Casual Leave', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-400' },
      { type: 'el', label: 'Earned Leave', bgColor: 'bg-green-100', borderColor: 'border-green-400' },
      { type: 'lwp', label: 'Leave Without Pay', bgColor: 'bg-gray-100', borderColor: 'border-gray-400' },
      { type: 'maternity', label: 'Maternity Leave', bgColor: 'bg-pink-100', borderColor: 'border-pink-400' },
      { type: 'paternity', label: 'Paternity Leave', bgColor: 'bg-blue-100', borderColor: 'border-blue-400' },
      { type: 'half_day_cl', label: 'Half Day Casual Leave', bgColor: 'bg-orange-100', borderColor: 'border-orange-400' },
      { type: 'half_day_el', label: 'Half Day Earned Leave', bgColor: 'bg-teal-100', borderColor: 'border-teal-400' },
      { type: 'half_day_lwp', label: 'Half Day Leave Without Pay', bgColor: 'bg-gray-300', borderColor: 'border-gray-600' },
    ];

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">{monthName} {year}</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-2 rounded-full hover:bg-gray-200 transition duration-200"
              aria-label="Previous month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => handleMonthChange(1)}
              className="p-2 rounded-full hover:bg-gray-200 transition duration-200"
              aria-label="Next month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500 mb-2">
          {daysOfWeek.map(day => (
            <div key={`weekday-${day}`}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const key = day.day
              ? `${year}-${monthName}-${day.day}`
              : `empty-${year}-${monthName}-${index}`;
            return (
              <div
                key={key}
                className={`aspect-square flex items-center justify-center border rounded-sm text-sm ${
                  day.day ? getLeaveColor(day.leaveType, day.isHalfDay) : 'bg-gray-100'
                } ${day.day && (day.leaveType || day.isHalfDay) ? 'cursor-help' : ''}`}
                title={day.day && (day.leaveType || day.isHalfDay) ? getLeaveTooltip(day.leaveType, day.isHalfDay) : ''}
              >
                {day.day || ''}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          {leaveTypes.map(leave => (
            <div key={leave.type} className="flex items-center space-x-2">
              <div className={`w-4 h-4 ${leave.bgColor} border ${leave.borderColor}`}></div>
              <span className="text-sm">{leave.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDepartmentView = () => {
    const department = departmentData.find(d => d.id === selectedDepartment);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={backToOverview}
              className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition duration-200"
              aria-label="Back to departments"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h2 className="text-2xl font-semibold text-gray-800">{department ? department.name : 'Department'}</h2>
          </div>
          {department && (
            <button
              onClick={() => handleExportExcel(selectedDepartment)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-200 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Export Leave Report</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Action</th>
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
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                      >
                        <span>View Leave Calendar</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
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
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={backToDepartment}
            className="p-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold">{selectedEmployee.name}'s Leave Calendar</h2>
        </div>

        {renderLeaveCalendar()}
      </div>
    );
  };

  const renderDepartmentGrid = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {departmentData.map((dept, index) => (
          <div
            key={dept.id ?? `dept-${index}`}
            onClick={() => handleDepartmentClick(dept.id)}
            className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500 hover:shadow-lg transition duration-300 cursor-pointer"
          >
            <div className="flex items-center space-x-5">
              <div className="flex-shrink-0 w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                <div className="flex space-x-6 mt-3">
                  <div className="text-gray-600">
                    <span className="font-medium">{dept.employeeCount}</span> Employees
                  </div>
                  <div className="text-red-600">
                    <span className="font-medium">{dept.onLeaveCount}</span> On Leave
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M12 2a10 10 0 0110 10 10 10 0 01-10 10 10 10 0 01-10-10 10 10 0 0110-10zM12 4a8 8 0 00-8 8 8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8z"
            ></path>
          </svg>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red-600 text-center p-4">
          {error}
        </div>
      );
    }

    if (selectedEmployee) {
      return renderEmployeeView();
    } else if (selectedDepartment) {
      return renderDepartmentView();
    } else {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Department Overview</h2>
          {departmentData.length > 0 ? (
            renderDepartmentGrid()
          ) : (
            <p className="text-gray-600">No departments available.</p>
          )}
        </div>
      );
    }
  };

  const metrics = [
    { key: 'total-employees', title: 'Total Employees', value: overallData.totalEmployees, borderColor: 'border-blue-500' },
    { key: 'on-leave-today', title: 'On Leave Today', value: overallData.onLeaveToday, borderColor: 'border-red-500' },
    { key: 'approved-leaves', title: 'Approved Leaves', value: overallData.approvedLeaves, borderColor: 'border-green-500' },
    { key: 'pending-leaves', title: 'Pending Leaves', value: overallData.pendingLeaves, borderColor: 'border-yellow-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-blue-700 text-white py-5 px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img
              src='/Images/bisag_logo.png'
              alt="BISAG-N Logo"
              className="h-16 w-auto"
            />
            <h1 className="text-2xl font-bold">BISAG-N HR Management System</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-base">
              <div className="font-medium">Welcome, {userData?.username || 'Loading...'}</div>
              <div className="text-blue-200">{userData?.department || 'Loading...'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-blue-800 hover:bg-blue-900 text-white py-2 px-4 rounded font-medium transition duration-150"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map(metric => (
            <div
              key={metric.key}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${metric.borderColor} hover:shadow-lg transition duration-300`}
            >
              <div className="text-gray-600 font-medium mb-1">{metric.title}</div>
              <div className="text-3xl font-bold text-gray-800">{metric.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          {renderMainContent()}
        </div>
      </div>

      <footer className="bg-blue-700 text-white py-4 text-center shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p>© 2025 BISAG-N. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}