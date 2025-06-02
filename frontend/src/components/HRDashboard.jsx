import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, CheckCircle, AlertCircle, Building, Menu, X, LogOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('role');

    if (!token || role !== 'HR') {
      setError('Access denied. Please log in as HR.');
      navigate('/');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:8081/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.role !== 'HR') {
            setError('Access denied. This dashboard is for HR only.');
            navigate('/');
            return;
          }
          setUserData({
            fullName: data.fullName || 'HR Manager',
            department: data.department || 'Human Resources',
          });
        } else if (response.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('role');
          navigate('/');
        } else {
          setError('Failed to fetch user data.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to fetch user data.');
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
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Department data fetched:', data);
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
        setError('Failed to load department data.');
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
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dashboard metrics fetched:', data);
        setOverallData({
          totalEmployees: data.totalEmployees || 0,
          onLeaveToday: data.onLeaveToday || 0,
          approvedLeaves: data.approvedLeaves || 0,
          pendingLeaves: data.pendingLeaves || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard metrics.');
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

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => setNotification({ message: '', type: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchEmployeesInDepartment = async (deptId) => {
    const token = localStorage.getItem('authToken');
    try {
      setIsLoading(true);
      setError(null);
      console.log(`Fetching employees for department ID: ${deptId}`);
      const response = await fetch(`http://localhost:8081/api/hr/departments/${deptId}/employees`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Employees fetched:', data);
      const formattedEmployees = data.map(employee => {
        const getDatesInRange = (startDate, endDate) => {
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
            currentDate.setDate(currentDate.getDate() + 1);
          }
          return dates;
        };

        const mapLeaves = (applications, leaveType) => {
          if (!applications || !Array.isArray(applications)) {
            console.warn(`No valid leave applications for ${employee.fullName}, type: ${leaveType}`);
            return [];
          }
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
          const filteredApps = applications.filter(app => {
            const appLeaveType = app.leaveType ? app.leaveType.toUpperCase() : '';
            const normalizedLeaveType = typeMapping[appLeaveType] || appLeaveType;
            return normalizedLeaveType === leaveType && app.status === 'APPROVED';
          });

          const uniqueDates = new Set();
          filteredApps.forEach(app => {
            const dates = getDatesInRange(app.startDate, app.endDate);
            dates.forEach(date => {
              if (['CL', 'LWP', 'HALF_DAY_CL', 'HALF_DAY_LWP'].includes(leaveType)) {
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
            isHalfDay: leaveType.includes('HALF_DAY'),
            leaveType: leaveType,
          }));
        };

        return {
          id: employee.id,
          name: employee.fullName || 'Unnamed Employee',
          position: employee.role || 'Employee',
          leaves: {
            cl: mapLeaves(employee.leaveApplications, 'CL'),
            el: mapLeaves(employee.leaveApplications, 'EL'),
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
      console.error('Error fetching employees:', error);
      setError(`Failed to load employee data: ${error.message}`);
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
    if (day === 0) return false;
    if (day === 6) return !(weekOfMonth === 2 || weekOfMonth === 4);
    return true;
  };

  const handleExportExcel = async (deptId) => {
    const dept = departmentData.find(d => d.id === deptId);
    if (!dept || !employeesInDepartment.length) {
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
            const shouldCheckWorkingDay = ['CL', 'HALF_DAY_CL', 'LWP', 'HALF_DAY_LWP'].includes(leaveType);
            const isValidDay = shouldCheckWorkingDay ? isWorkingDay(leave.date) : true;
            return isInMonth && isValidDay;
          });
          return filteredLeaves.reduce((total, leave) => {
            return total + (leave.isHalfDay || isHalfDayType ? 0.5 : 1);
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
      const headers = Object.keys(reportData[0]);
      worksheet.columns = headers.map(header => ({
        header,
        key: header,
        width: header === 'Employee Name' ? 20 : 15,
      }));
      reportData.forEach(data => worksheet.addRow(data));
      const monthName = currentMonth.toLocaleString('default', { month: 'long' });
      const fileName = `${dept.name}_Leave_Report_${monthName}_${year}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
      setNotification({ message: 'Leave report exported successfully', type: 'success' });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      setNotification({ message: 'Failed to export leave report.', type: 'error' });
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
      setError('Invalid department selected.');
      return;
    }
    console.log('Department clicked, ID:', deptId);
    setSelectedDepartment(deptId);
    setSelectedEmployee(null);
    setActiveView(null); // Clear activeView to ensure department view renders
    fetchEmployeesInDepartment(deptId);
  };

  const handleEmployeeClick = (employee) => {
    console.log('Employee clicked:', employee.name);
    setSelectedEmployee(employee);
  };

  const handleMonthChange = (increment) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const backToOverview = () => {
    console.log('Returning to department overview');
    setSelectedDepartment(null);
    setSelectedEmployee(null);
    setEmployeesInDepartment([]);
    setActiveView('department-overview');
  };

  const backToDepartment = () => {
    console.log('Returning to department view');
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
        case 'cl': return 'bg-yellow-200 border-yellow-500 text-yellow-900';
        case 'el': return 'bg-green-200 border-green-500 text-green-900';
        case 'lwp': return 'bg-gray-200 border-gray-500 text-gray-900';
        case 'maternity': return 'bg-pink-200 border-pink-500 text-pink-900';
        case 'paternity': return 'bg-blue-200 border-blue-500 text-blue-900';
        case 'half_day_cl': return 'bg-orange-200 border-orange-500 text-orange-900';
        case 'half_day_el': return 'bg-teal-200 border-teal-500 text-teal-900';
        case 'half_day_lwp': return 'bg-gray-300 border-gray-600 text-gray-900';
        default: return 'bg-white hover:bg-gray-50';
      }
    };

    const getLeaveTooltip = (type, isHalfDay) => {
      switch (type) {
        case 'cl': return 'Casual Leave';
        case 'el': return 'Earned Leave';
        case 'lwp': return 'Leave Without Pay';
        case 'maternity': return 'Maternity Leave';
        case 'paternity': return 'Paternity Leave';
        case 'half_day_cl': return 'Half Day Casual Leave';
        case 'half_day_el': return 'Half Day Earned Leave';
        case 'half_day_lwp': return 'Half Day Leave Without Pay';
        default: return '';
      }
    };

    const leaveTypes = [
      { type: 'cl', label: 'Casual Leave', bgColor: 'bg-yellow-200', borderColor: 'border-yellow-500' },
      { type: 'el', label: 'Earned Leave', bgColor: 'bg-green-200', borderColor: 'border-green-500' },
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
    const department = departmentData.find(d => d.id === selectedDepartment);
    if (!department) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-700">Department not found.</p>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={backToOverview}
              className="p-2 rounded-full hover:bg-gray-100 transition duration-200"
              aria-label="Back to departments"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            <h2 className="text-2xl font-semibold text-gray-900">{department.name}</h2>
          </div>
          <button
            onClick={() => handleExportExcel(selectedDepartment)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
          >
            <Download size={16} />
            <span>Export Leave Report</span>
          </button>
        </div>
        {employeesInDepartment.length === 0 && !isLoading ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-700">No employees found in this department.</p>
          </div>
        ) : (
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
        )}
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

  const renderDepartmentOverview = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Department Overview</h2>
        {departmentData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departmentData.map((dept, index) => (
              <div
                key={dept.id ?? `dept-${index}`}
                onClick={() => handleDepartmentClick(dept.id)}
                className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Building size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                    <div className="mt-2 flex space-x-4">
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
        ) : (
          <p className="text-gray-600 text-center py-6">No departments available.</p>
        )}
      </div>
    );
  };

  const renderDashboardView = () => {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>
    );
  };

  const renderMainContent = () => {
    console.log('Rendering main content, states:', {
      isLoading,
      error,
      selectedEmployee: !!selectedEmployee,
      selectedDepartment,
      activeView,
    });

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
    }
    if (selectedDepartment) {
      return renderDepartmentView();
    }
    if (activeView === 'department-overview') {
      return renderDepartmentOverview();
    }
    return renderDashboardView();
  };

  const metrics = [
    { key: 'total-employees', title: 'Total Employees', value: overallData.totalEmployees, borderColor: 'border-blue-500', icon: <Users size={24} className="text-blue-500" /> },
    { key: 'on-leave-today', title: 'On Leave Today', value: overallData.onLeaveToday, borderColor: 'border-red-500', icon: <Clock size={24} className="text-red-500" /> },
    { key: 'approved-leaves', title: 'Approved Leaves', value: overallData.approvedLeaves, borderColor: 'border-green-500', icon: <CheckCircle size={24} className="text-green-500" /> },
    { key: 'pending-leaves', title: 'Pending Leaves', value: overallData.pendingLeaves, borderColor: 'border-yellow-500', icon: <AlertCircle size={24} className="text-yellow-500" /> },
  ];

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
            onClick={() => setActiveView('department-overview')}
            className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${
              activeView === 'department-overview' ? 'bg-blue-800' : 'hover:bg-blue-800'
            }`}
          >
            <Building size={20} className="mr-3" />
            Department Overview
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 text-left rounded-lg hover:bg-red-600 transition duration-200"
          >
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
            <h1 className="text-2xl font-semibold text-gray-900">HR Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Welcome, {userData?.fullName || 'HR Manager'}</span>
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