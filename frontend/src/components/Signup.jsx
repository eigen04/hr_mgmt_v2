import React, { useState, useEffect } from 'react';
import { Calendar, User, Mail, Lock, Building } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    department: '',
    role: '',
    gender: '',
    reportingToId: null,
  });

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [reportingPersons, setReportingPersons] = useState([]);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  // Normalize department name
  const normalizeDepartment = (deptName) => {
    if (!deptName) return '';
    if (deptName.includes('Admin')) {
      return deptName.includes('Administration') ? 'Administration' : 'Admin';
    }
    return deptName;
  };

  // Check if reporting person is required
  const isReportingPersonRequired = () => {
    const normalizedDept = normalizeDepartment(formData.department);
    const isAdminHR = (normalizedDept === 'Admin' || normalizedDept === 'Administration') && formData.role === 'HR';
    return !isAdminHR && formData.role !== 'director';
  };

  // Fetch departments and roles
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('http://localhost:8081/api/departments', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Departments fetch response status:', response.status, 'URL:', response.url);
        if (response.ok) {
          const data = await response.json();
          console.log('Departments:', data);
          setDepartments(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, department: data[0].name }));
          }
        } else {
          let errorMessage = 'Failed to load departments';
          if (response.status === 401) {
            errorMessage = 'Unable to load departments: Authentication required. Please contact an administrator.';
          } else if (response.status === 403) {
            errorMessage = 'Unable to load departments: Access forbidden.';
          }
          const data = await response.json().catch(() => ({}));
          setNotification({ message: `${errorMessage} ${data.message || ''}`, type: 'error' });
          setDepartments([]);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setNotification({ message: 'Error loading departments: Network or server issue.', type: 'error' });
        setDepartments([]);
      }
    };

    const fetchRoles = async () => {
      try {
        const response = await fetch('http://localhost:8081/api/roles', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Roles fetch response status:', response.status, 'URL:', response.url);
        if (response.ok) {
          const data = await response.json();
          console.log('Roles:', data);
          const formattedRoles = data.map((role) => ({
            id: role.id,
            name: role.name.toLowerCase() === 'director' ? 'director' :
                  role.name.toLowerCase() === 'hr' ? 'HR' :
                  role.name.toUpperCase(),
            displayName: role.name,
          }));
          console.log('Formatted Roles:', formattedRoles);
          setRoles(formattedRoles);
          if (formattedRoles.length > 0) {
            setFormData(prev => ({ ...prev, role: formattedRoles[0].name }));
          }
        } else {
          let errorMessage = 'Failed to load roles';
          if (response.status === 401) {
            errorMessage = 'Unable to load roles: Authentication required. Please contact an administrator.';
          } else if (response.status === 403) {
            errorMessage = 'Unable to load roles: Access forbidden.';
          }
          const data = await response.json().catch(() => ({}));
          setNotification({ message: `${errorMessage} ${data.message || ''}`, type: 'error' });
          setRoles([]);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        setNotification({ message: 'Error loading roles: Network or server issue.', type: 'error' });
        setRoles([]);
      }
    };

    fetchDepartments();
    fetchRoles();
  }, []);

  // Fetch reporting persons based on role and department
  useEffect(() => {
    const fetchReportingPersons = async () => {
      if (isReportingPersonRequired() && formData.department && formData.role) {
        try {
          const normalizedDept = normalizeDepartment(formData.department);
          console.log('Fetching reporting persons with role:', formData.role, 'department:', normalizedDept);
          const response = await fetch(`http://localhost:8081/api/auth/reporting-persons?role=${formData.role}&department=${encodeURIComponent(normalizedDept)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const text = await response.text();
          console.log('Raw API Response for reporting-persons:', text);
          try {
            const data = JSON.parse(text);
            console.log('Parsed API Response for reporting-persons:', data);
            if (response.ok) {
              let filteredPersons = data;
              if (formData.role === 'ASSISTANT_DIRECTOR') {
                filteredPersons = data.filter(person =>
                  ['director', 'DIRECTOR', 'Director'].includes(person.role)
                );
                if (filteredPersons.length === 0) {
                  setNotification({ message: 'No directors available for reporting.', type: 'error' });
                } else if (filteredPersons.length === 1) {
                  setFormData(prev => ({ ...prev, reportingToId: filteredPersons[0].id }));
                }
              } else if (formData.role === 'PROJECT_MANAGER') {
                filteredPersons = data.filter(person =>
                  ['ASSISTANT_DIRECTOR', 'assistant_director', 'Assistant Director'].includes(person.role)
                );
                if (filteredPersons.length === 0) {
                  setNotification({ message: 'No Assistant Directors available for reporting in this department.', type: 'error' });
                } else if (filteredPersons.length === 1) {
                  setFormData(prev => ({ ...prev, reportingToId: filteredPersons[0].id }));
                }
              } else if (formData.role === 'EMPLOYEE') {
                filteredPersons = data.filter(person =>
                  ['PROJECT_MANAGER', 'project_manager', 'Project Manager'].includes(person.role)
                );
                if (filteredPersons.length === 0) {
                  setNotification({ message: 'No Project Managers available for reporting in this department.', type: 'error' });
                } else if (filteredPersons.length === 1) {
                  setFormData(prev => ({ ...prev, reportingToId: filteredPersons[0].id }));
                }
              }
              setReportingPersons(filteredPersons);
            } else {
              console.error('API Error:', response.status, data);
              setNotification({ message: `Failed to load reporting persons: ${data.message || 'Unknown error'}`, type: 'error' });
              setReportingPersons([]);
            }
          } catch (jsonError) {
            console.error('JSON Parse Error:', jsonError, 'Response Text:', text);
            setNotification({ message: 'Invalid response from server. Please check the backend.', type: 'error' });
            setReportingPersons([]);
          }
        } catch (error) {
          console.error('Error fetching reporting persons:', error);
          setNotification({ message: 'Error loading reporting persons. Please check network or server.', type: 'error' });
          setReportingPersons([]);
        }
      } else {
        console.log('Clearing reporting persons for Admin/HR or Director');
        setReportingPersons([]);
        setFormData(prev => ({ ...prev, reportingToId: null }));
      }
    };

    fetchReportingPersons();
  }, [formData.role, formData.department]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'department' ? normalizeDepartment(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form Data:', formData);
    console.log('Is Reporting Person Required:', isReportingPersonRequired());

    if (formData.password !== formData.confirmPassword) {
      setNotification({ message: 'Passwords do not match!', type: 'error' });
      return;
    }

    if (!formData.fullName || !formData.username || !formData.email || !formData.role || !formData.gender) {
      setNotification({ message: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    if (formData.role !== 'director' && !formData.department) {
      setNotification({ message: 'Department is required.', type: 'error' });
      return;
    }

    if (isReportingPersonRequired() && !formData.reportingToId) {
      setNotification({ message: 'Please select a reporting person.', type: 'error' });
      return;
    }

    // Prepare payload matching UserDTO
    const userData = {
      fullName: formData.fullName,
      username: formData.username,
      password: formData.password,
      email: formData.email,
      department: formData.role === 'director' ? null : normalizeDepartment(formData.department),
      role: formData.role,
      gender: formData.gender,
      reportingToId: isReportingPersonRequired() ? formData.reportingToId : null,
    };

    try {
      const response = await fetch('http://localhost:8081/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();

      if (response.ok) {
        setNotification({ message: 'Account created successfully!', type: 'success' });
        setFormData({
          fullName: '',
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          department: '',
          role: '',
          gender: '',
          reportingToId: null,
        });
        setTimeout(() => navigate('/'), 2000);
      } else {
        setNotification({
          message: `Signup failed: ${responseData.message || 'Unknown error'}`,
          type: 'error',
        });
      }
    } catch (error) {
      setNotification({
        message: 'An error occurred. Please try again.',
        type: 'error',
      });
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-700 text-white py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src="/Images/bisag_logo.png"
              alt="BISAG-N Logo"
              className="h-20 w-30 rounded-full"
            />
            <h1 className="text-xl font-bold">BISAG-N HR Management System</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Create Your Account</h2>
            <p className="text-blue-100 text-sm">Join the BISAG-N team</p>
          </div>

          <div className="p-6">
            {notification.message && (
              <div
                className={`mb-4 p-3 rounded-md text-sm ${
                  notification.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {notification.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="johndoe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="john.doe@bisag-n.gov.in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building size={18} className="text-gray-400" />
                  </div>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    disabled={formData.role === 'director'}
                    className={`pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none ${
                      formData.role === 'director' ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">Select Department</option>
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <option key={dept.id || `dept-${dept.name}`} value={dept.name}>
                          {dept.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No departments available
                      </option>
                    )}
                  </select>
                </div>
                {formData.role === 'director' && (
                  <p className="text-xs text-gray-500 mt-1">Directors do not belong to any department.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building size={18} className="text-gray-400" />
                  </div>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">Select Role</option>
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <option key={role.id || `role-${role.name}`} value={role.name}>
                          {role.displayName}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No roles available
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {isReportingPersonRequired() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporting To</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <select
                      name="reportingToId"
                      value={formData.reportingToId || ''}
                      onChange={handleChange}
                      disabled={reportingPersons.length === 1}
                      className={`pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none ${
                        reportingPersons.length === 1 ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="">Select Reporting Person</option>
                      {reportingPersons.length > 0 ? (
                        reportingPersons.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.fullName} ({person.role})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No reporting persons available
                        </option>
                      )}
                    </select>
                  </div>
                  {formData.role === 'ASSISTANT_DIRECTOR' && (
                    <p className="text-xs text-gray-500 mt-1">Assistant Directors must report to the Director.</p>
                  )}
                </div>
              )}
              {!isReportingPersonRequired() && formData.department && formData.role && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === 'director' 
                    ? 'Directors do not report to anyone.' 
                    : 'HR members in Admin department do not require a reporting person.'}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Create a strong password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {passwordVisible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type={confirmPasswordVisible ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Confirm password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {confirmPasswordVisible ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Create Account
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-blue-700 text-white py-4 text-center shadow-inner">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-white-500">
          <p>© 2025 BISAG-N. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}