import { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, FileText, PlusCircle, Clock, AlertCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HodDashboard() {
  const [leaveRequests, setLeaveRequests] = useState([]); // Employee leave requests
  const [myLeaveRequests, setMyLeaveRequests] = useState([]); // HOD's own leave requests
  const [departmentStats, setDepartmentStats] = useState({
    totalMembers: 0,
    onLeave: 0
  });
  const [userData, setUserData] = useState(null);
  const [leaveFormData, setLeaveFormData] = useState({
    leaveType: 'CL',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false
  });
  const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Fetch dashboard data, user data, and HOD's leave applications
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
        const userResponse = await fetch('http://localhost:8081/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserData(userData);
        } else if (userResponse.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('authToken');
          navigate('/');
          return;
        } else {
          setError('Failed to fetch user data');
          return;
        }

        // Fetch pending leave applications for the department (employee leaves)
        const leaveResponse = await fetch('http://localhost:8081/api/leaves/department/pending', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (leaveResponse.ok) {
          const leaveData = await leaveResponse.json();
          setLeaveRequests(leaveData);
        } else {
          setError('Failed to fetch employee leave applications');
        }

        // Fetch HOD's own leave applications
        const myLeaveResponse = await fetch('http://localhost:8081/api/leaves', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (myLeaveResponse.ok) {
          const myLeaveData = await myLeaveResponse.json();
          setMyLeaveRequests(myLeaveData);
        } else {
          setError('Failed to fetch your leave applications');
        }

        // Fetch department stats
        const statsResponse = await fetch('http://localhost:8081/api/leaves/department/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDepartmentStats(statsData);
        } else {
          setError('Failed to fetch department stats');
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8081/api/leaves/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setLeaveRequests(leaveRequests.map(request => 
          request.id === id ? { ...request, status: 'APPROVED' } : request
        ));
        // Update department stats
        const statsResponse = await fetch('http://localhost:8081/api/leaves/department/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDepartmentStats(statsData);
        }
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setLeaveRequests(leaveRequests.map(request => 
          request.id === id ? { ...request, status: 'REJECTED' } : request
        ));
        // Update department stats
        const statsResponse = await fetch('http://localhost:8081/api/leaves/department/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDepartmentStats(statsData);
        }
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

  const calculateEndDate = (startDate, leaveType) => {
    if (!startDate) return '';
    const start = new Date(startDate);
    if (leaveType === 'ML') {
      start.setDate(start.getDate() + 179); // 180 days total, so +179 from start
    } else if (leaveType === 'PL') {
      start.setDate(start.getDate() + 14); // 15 days total, so +14 from start
    }
    return start.toISOString().split('T')[0];
  };

  const handleLeaveSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    if (!leaveFormData.startDate || !leaveFormData.reason) {
      setError('Please fill all required fields');
      setIsSubmitting(false);
      return;
    }

    if (leaveFormData.leaveType !== 'ML' && leaveFormData.leaveType !== 'PL' && !leaveFormData.isHalfDay && !leaveFormData.endDate) {
      setError('Please provide an end date for non-maternity/paternity leaves');
      setIsSubmitting(false);
      return;
    }

    const endDate = leaveFormData.isHalfDay ? leaveFormData.startDate : 
                    (leaveFormData.leaveType === 'ML' || leaveFormData.leaveType === 'PL') ? 
                    calculateEndDate(leaveFormData.startDate, leaveFormData.leaveType) : 
                    leaveFormData.endDate;

    try {
      const response = await fetch('http://localhost:8081/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          leaveType: leaveFormData.leaveType,
          startDate: leaveFormData.startDate,
          endDate,
          reason: leaveFormData.reason,
          isHalfDay: leaveFormData.isHalfDay
        })
      });

      if (response.ok) {
        setSuccessMessage('Leave application submitted successfully! Awaiting Director approval.');
        setLeaveFormData({
          leaveType: 'CL',
          startDate: '',
          endDate: '',
          reason: '',
          isHalfDay: false
        });
        setIsLeaveFormOpen(false);

        // Refresh HOD's leave applications
        const myLeaveResponse = await fetch('http://localhost:8081/api/leaves', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        if (myLeaveResponse.ok) {
          const myLeaveData = await myLeaveResponse.json();
          setMyLeaveRequests(myLeaveData);
        } else {
          setError('Failed to refresh your leave applications');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit leave application');
      }
    } catch (err) {
      setError('An error occurred while submitting the application');
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src='/Images/bisag_logo.png' 
              alt="BISAG-N Logo" 
              className="h-20 w-30 rounded-full"
            />
            <h1 className="text-xl font-bold">BISAG-N HR Management System</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-sm font-medium text-white bg-red-600 hover:bg-red-700 py-2 px-4 rounded-md"
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">HOD Dashboard</h2>
            <p className="text-gray-600">Manage leave requests and department statistics</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Statistics */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-6 w-6 text-blue-600 mr-3" />
                    <span className="text-gray-700">Total Members</span>
                  </div>
                  <span className="font-semibold">{departmentStats.totalMembers}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-6 w-6 text-blue-600 mr-3" />
                    <span className="text-gray-700">On Leave</span>
                  </div>
                  <span className="font-semibold">{departmentStats.onLeave}</span>
                </div>
              </div>
            </div>

            {/* Leave Requests and Application */}
            <div className="lg:col-span-2 space-y-6">
              {/* HOD's Own Leave Applications */}
              <div className="bg-white rounded-xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">My Leave Applications</h3>
                  <button
                    onClick={() => setIsLeaveFormOpen(!isLeaveFormOpen)}
                    className="flex items-center text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 py-2 px-4 rounded-md"
                  >
                    <PlusCircle size={16} className="mr-2" />
                    {isLeaveFormOpen ? 'Close Form' : 'Apply for Leave'}
                  </button>
                </div>

                {/* Leave Application Form */}
                {isLeaveFormOpen && (
                  <div className="border-t border-gray-200 pt-6 mb-6">
                    <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Apply for Leave
                    </h4>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                          <select
                            value={leaveFormData.leaveType}
                            onChange={(e) => setLeaveFormData({ ...leaveFormData, leaveType: e.target.value, isHalfDay: false })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoComplete="off"
                          >
                            <option value="CL">Casual Leave (CL)</option>
                            <option value="EL">Earned Leave (EL)</option>
                            {userData?.gender === 'Female' && (
                              <option value="ML">Maternity Leave (ML)</option>
                            )}
                            {userData?.gender === 'Male' && (
                              <option value="PL">Paternity Leave (PL)</option>
                            )}
                            <option value="HALF_DAY">Half-Day Leave</option>
                          </select>
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
                              className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              autoComplete="off"
                            />
                          </div>
                        </div>
                        {leaveFormData.leaveType !== 'ML' && leaveFormData.leaveType !== 'PL' && !leaveFormData.isHalfDay && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar size={18} className="text-gray-400" />
                              </div>
                              <input
                                type="date"
                                value={leaveFormData.endDate}
                                onChange={(e) => setLeaveFormData({ ...leaveFormData, endDate: e.target.value })}
                                className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoComplete="off"
                              />
                            </div>
                          </div>
                        )}
                        {leaveFormData.leaveType !== 'ML' && leaveFormData.leaveType !== 'PL' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Half-Day Leave</label>
                            <input
                              type="checkbox"
                              checked={leaveFormData.isHalfDay}
                              onChange={(e) => setLeaveFormData({ ...leaveFormData, isHalfDay: e.target.checked, endDate: e.target.checked ? '' : leaveFormData.endDate })}
                              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
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
                      <button
                        onClick={handleLeaveSubmit}
                        disabled={isSubmitting}
                        className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200`}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </div>
                  </div>
                )}

                {/* HOD's Leave Applications Table */}
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
                        {myLeaveRequests.map((request) => (
                          <tr key={request.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{request.id}</td>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Employee Leave Requests */}
              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Employee Leave Requests</h3>
                {isLoading ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600">Loading...</p>
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600">No pending employee leave requests</p>
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
                            <td className="py-3 px-4">{request.remainingLeaves}</td>
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
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-700 text-white py-4 text-center shadow-inner">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-white-500">
          <p>© 2025 BISAG-N. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}