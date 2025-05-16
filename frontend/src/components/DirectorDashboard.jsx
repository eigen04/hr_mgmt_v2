import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, PlusCircle, AlertCircle, LogOut, Building, FileText, UserPlus, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DirectorDashboard() {
  const [hodLeaveRequests, setHodLeaveRequests] = useState([]);
  const [departmentStats, setDepartmentStats] = useState({
    totalDepartments: 0,
    activeHods: 0,
  });
  const [leaveStats, setLeaveStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [roles, setRoles] = useState([]); // Removed mocked roles data
  const [hods, setHods] = useState([]);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
  });
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
  });
  const [isDepartmentFormOpen, setIsDepartmentFormOpen] = useState(false);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [isLeaveRequestsOpen, setIsLeaveRequestsOpen] = useState(true); // Added state for collapsible section
  const [isRolesSectionOpen, setIsRolesSectionOpen] = useState(true); // Added state for collapsible section
  const [isUsersSectionOpen, setIsUsersSectionOpen] = useState(true); // Added state for collapsible section
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Fetch dashboard data
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
  
        // Fetch pending HOD leave requests
        console.log("Fetching HOD leave requests...");
        const leaveResponse = await fetch('http://localhost:8081/api/leaves/hod/pending', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (leaveResponse.ok) {
          const leaveData = await leaveResponse.json();
          setHodLeaveRequests(leaveData);
          console.log("HOD leave requests fetched successfully:", leaveData);
        } else {
          const errorData = await leaveResponse.json();
          console.error("Failed to fetch HOD leave requests:", errorData);
          setError(errorData.message || 'Failed to fetch HOD leave requests');
        }
  
        // Fetch department stats
        console.log("Fetching department stats...");
        const deptResponse = await fetch('http://localhost:8081/api/departments/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          setDepartmentStats(deptData);
          console.log("Department stats fetched successfully:", deptData);
        } else {
          const errorData = await deptResponse.json();
          console.error("Failed to fetch department stats:", errorData);
          setError(errorData.message || 'Failed to fetch department stats');
        }
  
        // Fetch leave stats
        console.log("Fetching leave stats...");
        const leaveStatsResponse = await fetch('http://localhost:8081/api/leaves/hod/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (leaveStatsResponse.ok) {
          const leaveStatsData = await leaveStatsResponse.json();
          setLeaveStats(leaveStatsData);
          console.log("Leave stats fetched successfully:", leaveStatsData);
        } else {
          const errorData = await leaveStatsResponse.json();
          console.error("Failed to fetch leave stats:", errorData);
          setError(errorData.message || 'Failed to fetch leave statistics');
        }
  
        // Fetch HOD accounts
        console.log("Fetching HOD accounts...");
        const hodsResponse = await fetch('http://localhost:8081/api/users/hods', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (hodsResponse.ok) {
          const hodsData = await hodsResponse.json();
          setHods(hodsData);
          console.log("HOD accounts fetched successfully:", hodsData);
        } else {
          const errorData = await hodsResponse.json();
          console.error("Failed to fetch HOD accounts:", errorData);
          setError(errorData.message || 'Failed to fetch HOD accounts');
        }
  
        // Fetch roles
        console.log("Fetching roles...");
        const rolesResponse = await fetch('http://localhost:8081/api/roles', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          setRoles(rolesData);
          console.log("Roles fetched successfully:", rolesData);
        } else {
          const errorData = await rolesResponse.json();
          console.error("Failed to fetch roles:", errorData);
          setError(errorData.message || 'Failed to fetch roles');
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Handle leave approval
const handleApprove = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    console.log('Approving leave with ID:', id); // Debug log
    const response = await fetch(`http://localhost:8081/api/leaves/${id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    console.log('Approve leave response status:', response.status); // Debug log
    let errorData = {};
    try {
      errorData = await response.json(); // Attempt to parse JSON
    } catch (jsonError) {
      console.warn('Response is not valid JSON:', jsonError);
      errorData = { message: 'Unexpected server response' };
    }
    console.log('Approve leave response data:', errorData); // Debug log
    if (response.ok) {
      setHodLeaveRequests(hodLeaveRequests.map((request) =>
        request.id === id ? { ...request, status: 'APPROVED' } : request
      ));
      setSuccessMessage('Leave approved successfully');
      const leaveStatsResponse = await fetch('http://localhost:8081/api/leaves/hod/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (leaveStatsResponse.ok) {
        setLeaveStats(await leaveStatsResponse.json());
      }
    } else {
      setError(errorData.message || 'Failed to approve leave');
      console.error('Failed to approve leave:', errorData.message || errorData);
    }
  } catch (err) {
    setError('Failed to approve leave: ' + err.message);
    console.error('Error approving leave:', err);
  }
};

  // Handle leave rejection
  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8081/api/leaves/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setHodLeaveRequests(hodLeaveRequests.map((request) =>
          request.id === id ? { ...request, status: 'REJECTED' } : request
        ));
        setSuccessMessage('Leave rejected successfully');
        const leaveStatsResponse = await fetch('http://localhost:8081/api/leaves/hod/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (leaveStatsResponse.ok) {
          setLeaveStats(await leaveStatsResponse.json());
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to reject leave');
        console.error('Failed to reject leave:', errorData);
      }
    } catch (err) {
      setError('Failed to reject leave');
      console.error('Error rejecting leave:', err);
    }
  };

  // Handle new department submission
const handleDepartmentSubmit = async () => {
  if (!newDepartment.name) {
    setError('Department name is required');
    return;
  }
  try {
    const token = localStorage.getItem('authToken');
    console.log('Sending request to add department:', newDepartment); // Debug log
    const response = await fetch('http://localhost:8081/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(newDepartment),
    });
    console.log('Response status:', response.status); // Debug log
    let errorData = {};
    try {
      errorData = await response.json(); // Attempt to parse JSON
    } catch (jsonError) {
      console.warn('Response is not valid JSON:', jsonError);
      errorData = { message: 'Unexpected server response' };
    }
    console.log('Response data:', errorData); // Debug log
    if (response.ok) {
      setSuccessMessage('Department added successfully');
      setNewDepartment({ name: '', description: '' });
      setIsDepartmentFormOpen(false);
      const deptResponse = await fetch('http://localhost:8081/api/departments/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (deptResponse.ok) {
        setDepartmentStats(await deptResponse.json());
      }
    } else {
      if (response.status === 403) {
        setError('You are not authorized to add a department. Please ensure you have the Director role.');
      } else {
        setError(errorData.message || 'Failed to add department');
      }
      console.error('Failed to add department:', errorData);
    }
  } catch (err) {
    setError('Failed to add department: ' + err.message);
    console.error('Error adding department:', err);
  }
};

  // Handle new role submission
  const handleRoleSubmit = async () => {
    if (!newRole.name) {
      setError('Role name is required');
      return;
    }
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8081/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newRole),
      });
      if (response.ok) {
        const rolesResponse = await fetch('http://localhost:8081/api/roles', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (rolesResponse.ok) {
          const updatedRoles = await rolesResponse.json();
          setRoles(updatedRoles);
        }
        setSuccessMessage('Role added successfully');
        setNewRole({ name: '', description: '' });
        setIsRoleFormOpen(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add role');
        console.error('Failed to add role:', errorData);
      }
    } catch (err) {
      setError('Failed to add role');
      console.error('Error adding role:', err);
    }
  };

  // Handle HOD account activation/deactivation
  const handleToggleHodStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('authToken');
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await fetch(`http://localhost:8081/api/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setHods(hods.map((hod) =>
          hod.id === id ? { ...hod, status: newStatus } : hod
        ));
        setSuccessMessage(`HOD account ${newStatus.toLowerCase()} successfully`);
        const deptResponse = await fetch('http://localhost:8081/api/departments/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (deptResponse.ok) {
          setDepartmentStats(await deptResponse.json());
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || `Failed to ${newStatus.toLowerCase()} HOD account`);
        console.error(`Failed to ${newStatus.toLowerCase()} HOD account:`, errorData);
      }
    } catch (err) {
      setError(`Failed to ${currentStatus === 'ACTIVE' ? 'deactivate' : 'activate'} HOD account`);
      console.error(`Error toggling HOD status:`, err);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  // Status icon and color helpers
  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'APPROVED': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'APPROVED': return 'text-green-600 bg-green-50';
      case 'REJECTED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-800 text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="/Images/bisag_logo.png" alt="BISAG-N Logo" className="h-16 w-16 rounded-full border-2 border-white" />
            <div>
              <h1 className="text-2xl font-bold">BISAG-N HR Management System</h1>
              <p className="text-sm opacity-80">Director Dashboard</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-sm font-medium text-white bg-red-600 hover:bg-red-700 py-2 px-4 rounded-lg transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Director Dashboard</h2>
            <p className="text-gray-600 mt-1">Manage HOD leave requests, departments, roles, and users with ease.</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overview Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Overview
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Building className="h-6 w-6 text-blue-600 mr-3" />
                    <span className="text-gray-700 font-medium">Total Departments</span>
                  </div>
                  <span className="font-semibold text-blue-700">{departmentStats.totalDepartments}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Users className="h-6 w-6 text-blue-600 mr-3" />
                    <span className="text-gray-700 font-medium">Active HODs</span>
                  </div>
                  <span className="font-semibold text-blue-700">{departmentStats.activeHods}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-blue-600 mr-3" />
                    <span className="text-gray-700 font-medium">Pending Leaves</span>
                  </div>
                  <span className="font-semibold text-blue-700">{leaveStats.pending}</span>
                </div>
              </div>
            </div>

            {/* HOD Leave Requests and Department Management */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsLeaveRequestsOpen(!isLeaveRequestsOpen)}>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  HOD Leave Requests
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDepartmentFormOpen(!isDepartmentFormOpen);
                      if (!isDepartmentFormOpen) setIsLeaveRequestsOpen(false); // Collapse table when form opens
                    }}
                    className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg transition-colors"
                  >
                    <PlusCircle size={16} className="mr-2" />
                    {isDepartmentFormOpen ? 'Close Form' : 'Add Department'}
                  </button>
                  {isLeaveRequestsOpen ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
                </div>
              </div>

              {/* Add Department Form */}
              {isDepartmentFormOpen && (
                <div className="border-t border-gray-200 pt-6 mb-6 animate-slide-down">
                  <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-600" />
                    Add New Department
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={newDepartment.name}
                        onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., Information Technology"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={newDepartment.description}
                        onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                        rows="3"
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Describe the department's role..."
                        autoComplete="off"
                      ></textarea>
                    </div>
                    <button
                      onClick={handleDepartmentSubmit}
                      className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Add Department
                    </button>
                  </div>
                </div>
              )}

              {/* Leave Requests Table */}
              {isLeaveRequestsOpen && !isDepartmentFormOpen && (
                <div className="animate-slide-down">
                  {isLoading ? (
                    <div className="text-center py-6">
                      <p className="text-gray-600">Loading...</p>
                    </div>
                  ) : hodLeaveRequests.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-600">No pending HOD leave requests</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">HOD Name</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
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
                          {hodLeaveRequests.map((request) => (
                            <tr key={request.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{request.id}</td>
                              <td className="py-3 px-4">{request.userName}</td>
                              <td className="py-3 px-4">{request.department}</td>
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
                              <td className="py-3 px-4">{request.remainingLeaves}</td>
                              <td className="py-3 px-4">{request.isHalfDay ? 'Yes' : 'No'}</td>
                              <td className="py-3 px-4">
                                {request.status === 'PENDING' && (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleApprove(request.id)}
                                      className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                                      title="Approve"
                                    >
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    </button>
                                    <button
                                      onClick={() => handleReject(request.id)}
                                      className="p-2 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                                      title="Reject"
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
              )}
            </div>
          </div>

          {/* Role Management Section */}
          <div className="mt-6 bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsRolesSectionOpen(!isRolesSectionOpen)}>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                Role Management
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRoleFormOpen(!isRoleFormOpen);
                    if (!isRoleFormOpen) setIsRolesSectionOpen(false); // Collapse table when form opens
                  }}
                  className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg transition-colors"
                >
                  <PlusCircle size={16} className="mr-2" />
                  {isRoleFormOpen ? 'Close Form' : 'Add Role'}
                </button>
                {isRolesSectionOpen ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
              </div>
            </div>

            {/* Add Role Form */}
            {isRoleFormOpen && (
              <div className="border-t border-gray-200 pt-6 mb-6 animate-slide-down">
                <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                  Add New Role
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="e.g., MANAGER"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newRole.description}
                      onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                      rows="3"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Describe the role..."
                      autoComplete="off"
                    ></textarea>
                  </div>
                  <button
                    onClick={handleRoleSubmit}
                    className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Add Role
                  </button>
                </div>
              </div>
            )}

            {/* Roles Table */}
            {isRolesSectionOpen && !isRoleFormOpen && (
              <div className="animate-slide-down">
                {isLoading ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600">Loading...</p>
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600">No roles available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Role Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role) => (
                          <tr key={role.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{role.name}</td>
                            <td className="py-3 px-4">{role.description || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Management Section */}
          <div className="mt-6 bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsUsersSectionOpen(!isUsersSectionOpen)}>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                User Management
              </h3>
              {isUsersSectionOpen ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
            </div>
            {isUsersSectionOpen && (
              <div className="animate-slide-down">
                <p className="text-gray-600 mb-4">Manage HOD accounts (e.g., activate/deactivate).</p>
                {isLoading ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600">Loading...</p>
                  </div>
                ) : hods.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600">No HOD accounts available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hods.map((hod) => (
                          <tr key={hod.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{hod.id}</td>
                            <td className="py-3 px-4">{hod.fullName}</td>
                            <td className="py-3 px-4">{hod.department}</td>
                            <td className="py-3 px-4">{hod.email}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${hod.status === 'ACTIVE' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                {hod.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleHodStatus(hod.id, hod.status)}
                                className={`p-2 rounded-full ${hod.status === 'ACTIVE' ? 'bg-red-100 hover:bg-red-200' : 'bg-green-100 hover:bg-green-200'} transition-colors`}
                                title={hod.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              >
                                {hod.status === 'ACTIVE' ? (
                                  <ToggleLeft className="h-5 w-5 text-red-600" />
                                ) : (
                                  <ToggleRight className="h-5 w-5 text-green-600" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-700 to-blue-800 text-white py-4 text-center shadow-inner">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>© 2025 BISAG-N. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}