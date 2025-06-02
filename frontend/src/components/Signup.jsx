import React, { useState, useEffect } from 'react';
import { Calendar, User, Mail, Lock, Building, Eye, EyeOff, Sparkles, Shield, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [focusedField, setFocusedField] = useState(''); // For input focus effects
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
        if (response.ok) {
          const data = await response.json();
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
        if (response.ok) {
          const data = await response.json();
          const formattedRoles = data.map((role) => ({
            id: role.id,
            name: role.name.toLowerCase() === 'director' ? 'director' :
                  role.name.toLowerCase() === 'hr' ? 'HR' :
                  role.name.toUpperCase(),
            displayName: role.name,
          }));
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
          const response = await fetch(`http://localhost:8081/api/auth/reporting-persons?role=${formData.role}&department=${encodeURIComponent(normalizedDept)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const text = await response.text();
          try {
            const data = JSON.parse(text);
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Professional Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-lg opacity-75"></div>
              <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                BISAG-N
              </h1>
              <p className="text-blue-200 text-sm font-medium">HR Management System</p>
            </div>
            <div className="flex-1"></div>
            <div className="hidden md:flex items-center space-x-2 text-blue-200">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Secure Access Portal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Signup Card */}
          <div className="relative">
            {/* Glowing border effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-2xl blur-lg opacity-75 animate-pulse"></div>
            
            <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
              {/* Card Header */}
              <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                    <h2 className="text-2xl font-bold text-white">Create Your Account</h2>
                  </div>
                  <p className="text-blue-100 font-medium">Join the BISAG-N team</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-8">
                {/* Notification Messages */}
                {notification.message && (
                  <div className="mb-6 relative">
                    <div className={`absolute inset-0 rounded-xl blur-sm ${notification.type === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}></div>
                    <div className={`relative flex items-center p-4 rounded-xl border ${notification.type === 'success' ? 'bg-green-50/80 backdrop-blur-sm text-green-700 border-green-200/50' : 'bg-red-50/80 backdrop-blur-sm text-red-700 border-red-200/50'}`}>
                      {notification.type === 'success' ? (
                        <CheckCircle size={20} className="flex-shrink-0 mr-3 text-green-500" />
                      ) : (
                        <AlertCircle size={20} className="flex-shrink-0 mr-3 text-red-500" />
                      )}
                      <p className="text-sm font-medium">{notification.message}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700">
                      Full Name
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${focusedField === 'fullName' ? 'opacity-30' : ''}`}></div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User size={20} className={`transition-colors duration-300 ${focusedField === 'fullName' ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        <input
                          id="fullName"
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('fullName')}
                          onBlur={() => setFocusedField('')}
                          className="pl-12 pr-4 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                      Username
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${focusedField === 'username' ? 'opacity-30' : ''}`}></div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User size={20} className={`transition-colors duration-300 ${focusedField === 'username' ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        <input
                          id="username"
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('username')}
                          onBlur={() => setFocusedField('')}
                          className="pl-12 pr-4 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                          placeholder="johndoe"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${focusedField === 'email' ? 'opacity-30' : ''}`}></div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail size={20} className={`transition-colors duration-300 ${focusedField === 'email' ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        <input
                          id="email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField('')}
                          className="pl-12 pr-4 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                          placeholder="john.doe@bisag-n.gov.in"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <label htmlFor="department" className="block text-sm font-semibold text-gray-700">
                      Department
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${focusedField === 'department' ? 'opacity-30' : ''}`}></div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Building size={20} className={`transition-colors duration-300 ${focusedField === 'department' ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        <select
                          id="department"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('department')}
                          onBlur={() => setFocusedField('')}
                          disabled={formData.role === 'director'}
                          className={`pl-12 pr-4 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 appearance-none ${formData.role === 'director' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    </div>
                    {formData.role === 'director' && (
                      <p className="text-xs text-gray-500 mt-1">Directors do not belong to any department.</p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label htmlFor="role" className="block text-sm font-semibold text-gray-700">
                      Role
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${focusedField === 'role' ? 'opacity-30' : ''}`}></div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Building size={20} className={`transition-colors duration-300 ${focusedField === 'role' ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('role')}
                          onBlur={() => setFocusedField('')}
                          className="pl-12 pr-4 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 appearance-none"
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
                  </div>

                  {/* Reporting To */}
                  {isReportingPersonRequired() && (
                    <div className="space-y-2">
                      <label htmlFor="reportingToId" className="block text-sm font-semibold text-gray-700">
                        Reporting To
                      </label>
                      <div className="relative group">
                        <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${focusedField === 'reportingToId' ? 'opacity-30' : ''}`}></div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User size={20} className={`transition-colors duration-300 ${focusedField === 'reportingToId' ? 'text-blue-500' : 'text-gray-400'}`} />
                          </div>
                          <select
                            id="reportingToId"
                            name="reportingToId"
                            value={formData.reportingToId || ''}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('reportingToId')}
                            onBlur={() => setFocusedField('')}
                            disabled={reportingPersons.length === 1}
                            className={`pl-12 pr-4 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 appearance-none ${reportingPersons.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                  {/* Gender */}
                  <div className="space-y-2">
                    <label htmlFor="gender" className="block text-sm font-semibold text-gray-700">
                      Gender
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${focusedField === 'gender' ? 'opacity-30' : ''}`}></div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User size={20} className={`transition-colors duration-300 ${focusedField === 'gender' ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('gender')}
                          onBlur={() => setFocusedField('')}
                          className="pl-12 pr-4 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300 appearance-none"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-30' : ''}`}></div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock size={20} className={`transition-colors duration-300 ${focusedField === 'password' ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        <input
                          id="password"
                          type={passwordVisible ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField('')}
                          className="pl-12 pr-12 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors duration-300"
                        >
                          {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${focusedField === 'confirmPassword' ? 'opacity-30' : ''}`}></div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock size={20} className={`transition-colors duration-300 ${focusedField === 'confirmPassword' ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        <input
                          id="confirmPassword"
                          type={confirmPasswordVisible ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('confirmPassword')}
                          onBlur={() => setFocusedField('')}
                          className="pl-12 pr-12 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={toggleConfirmPasswordVisibility}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors duration-300"
                        >
                          {confirmPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="relative w-full h-12 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 shadow-blue-500/25 hover:shadow-blue-500/40"
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center space-x-2">
                      <span>Create Account</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </button>
                </form>

                {/* Sign In Link */}
                <div className="mt-8 text-center">
                  <p className="text-gray-600">
                    Already have an account?{' '}
                    <Link
                      to="/"
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-300 hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-blue-200/80 text-sm">
              Secure signup powered by advanced encryption
            </p>
          </div>
        </div>
      </main>

      {/* Professional Footer */}
      <footer className="relative z-10 bg-black/20 backdrop-blur-md border-t border-white/10 text-white py-6">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-medium">© 2025 BISAG-N. All rights reserved.</p>
          </div>
          <p className="text-xs text-blue-200/60">Bhaskaracharya National Institute for Space Applications and Geo-informatics</p>
        </div>
      </footer>
    </div>
  );
}