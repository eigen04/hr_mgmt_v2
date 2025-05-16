import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CalendarCheck, CalendarClock, FileText, Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';

export default function EmployeeDashboard() {
    const [userData, setUserData] = useState(null);
    const [leaveBalance, setLeaveBalance] = useState({
        casualLeave: { total: 12, used: 0, remaining: 12 },
        earnedLeave: { total: 20, used: 0, remaining: 20 },
        maternityLeave: { total: 182, used: 0, remaining: 182 },
        paternityLeave: { total: 15, used: 0, remaining: 15 }
    });
    const [leaveApplications, setLeaveApplications] = useState([]);
    const [leaveFormData, setLeaveFormData] = useState({
        leaveType: 'CL',
        startDate: '',
        endDate: '',
        reason: '',
        isHalfDay: false
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError('Please log in to continue');
                    navigate('/');
                    return;
                }

                const response = await fetch('http://localhost:8081/api/users/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                } else if (response.status === 401) {
                    setError('Session expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    navigate('/');
                } else {
                    setError('Failed to fetch user data. Please try again.');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('An error occurred. Please check your connection and try again.');
            }
        };

        const fetchLeaveData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) return;

                const balanceResponse = await fetch('http://localhost:8081/api/leaves/balance', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (balanceResponse.ok) {
                    const balanceData = await balanceResponse.json();
                    const sanitizedBalance = {
                        casualLeave: balanceData.casualLeave || { total: 12, used: 0, remaining: 12 },
                        earnedLeave: balanceData.earnedLeave || { total: 20, used: 0, remaining: 20 },
                        maternityLeave: balanceData.maternityLeave || { total: 182, used: 0, remaining: 182 },
                        paternityLeave: balanceData.paternityLeave || { total: 15, used: 0, remaining: 15 }
                    };
                    Object.keys(sanitizedBalance).forEach((key) => {
                        sanitizedBalance[key].used = Number(sanitizedBalance[key].used.toFixed(2));
                        sanitizedBalance[key].remaining = Number(sanitizedBalance[key].remaining.toFixed(2));
                    });
                    setLeaveBalance(sanitizedBalance);
                } else {
                    setError('Failed to fetch leave balance.');
                }

                const applicationsResponse = await fetch('http://localhost:8081/api/leaves', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (applicationsResponse.ok) {
                    const applicationsData = await applicationsResponse.json();
                    setLeaveApplications(applicationsData);
                } else {
                    setError('Failed to fetch leave applications.');
                }
            } catch (err) {
                console.error('Error fetching leave data:', err);
                setError('An error occurred while fetching leave data.');
            }
        };

        fetchUserData();
        fetchLeaveData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setUserData(null);
        navigate('/');
    };

    const calculateEndDate = (startDate, leaveType) => {
        if (!startDate) return '';
        const start = new Date(startDate);
        if (leaveType === 'ML') {
            start.setDate(start.getDate() + 179); // 180 days
        } else if (leaveType === 'PL') {
            start.setDate(start.getDate() + 14); // 15 days
        }
        return start.toISOString().split('T')[0];
    };

    const calculateLeaveDays = (startDate, endDate, leaveType, isHalfDay) => {
        if (isHalfDay) return 0.5;
        if (leaveType === 'ML') return 180;
        if (leaveType === 'PL') return 15;
        if (!endDate) return 1;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const handleLeaveSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');
    
        // Step 1: Validate required fields
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
    
        // Step 2: Fetch the latest leave balance from the server
        try {
            const token = localStorage.getItem('authToken');
            const balanceResponse = await fetch('http://localhost:8081/api/leaves/balance', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (!balanceResponse.ok) {
                setError('Failed to fetch leave balance. Please try again.');
                setIsSubmitting(false);
                return;
            }
    
            const balanceData = await balanceResponse.json();
            const sanitizedBalance = {
                casualLeave: balanceData.casualLeave || { total: 12, used: 0, remaining: 12 },
                earnedLeave: balanceData.earnedLeave || { total: 20, used: 0, remaining: 20 },
                maternityLeave: balanceData.maternityLeave || { total: 182, used: 0, remaining: 182 },
                paternityLeave: balanceData.paternityLeave || { total: 15, used: 0, remaining: 15 }
            };
            Object.keys(sanitizedBalance).forEach((key) => {
                sanitizedBalance[key].used = Number(sanitizedBalance[key].used.toFixed(2));
                sanitizedBalance[key].remaining = Number(sanitizedBalance[key].remaining.toFixed(2));
            });
            setLeaveBalance(sanitizedBalance);
    
            // Step 3: Check if there’s enough balance
            const leaveTypeMap = {
                CL: 'casualLeave',
                EL: 'earnedLeave',
                ML: 'maternityLeave',
                PL: 'paternityLeave',
                HALF_DAY: 'casualLeave'
            };
    
            const leaveKey = leaveTypeMap[leaveFormData.leaveType];
            const remainingLeaves = sanitizedBalance[leaveKey]?.remaining || 0;
            const requiredLeaves = calculateLeaveDays(
                leaveFormData.startDate,
                leaveFormData.endDate,
                leaveFormData.leaveType,
                leaveFormData.isHalfDay
            );
    
            if (remainingLeaves < requiredLeaves) {
                setError(`You don’t have enough ${leaveKey.replace(/([A-Z])/g, ' $1').toLowerCase()}. Remaining: ${remainingLeaves}`);
                setIsSubmitting(false);
                return;
            }
    
            // Step 4: If balance is sufficient, send the leave application request
            const endDate = leaveFormData.isHalfDay ? leaveFormData.startDate :
                            (leaveFormData.leaveType === 'ML' || leaveFormData.leaveType === 'PL') ?
                            calculateEndDate(leaveFormData.startDate, leaveFormData.leaveType) :
                            leaveFormData.endDate;
    
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
                    isHalfDay: leaveFormData.isHalfDay
                })
            });
    
            if (response.ok) {
                const newApplication = await response.json();
                setSuccessMessage('Leave application submitted successfully!');
                setLeaveFormData({
                    leaveType: 'CL',
                    startDate: '',
                    endDate: '',
                    reason: '',
                    isHalfDay: false
                });
    
                // Step 5: Refresh leave balance and applications after successful submission
                const balanceResponse = await fetch('http://localhost:8081/api/leaves/balance', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (balanceResponse.ok) {
                    const balanceData = await balanceResponse.json();
                    const sanitizedBalance = {
                        casualLeave: balanceData.casualLeave || { total: 12, used: 0, remaining: 12 },
                        earnedLeave: balanceData.earnedLeave || { total: 20, used: 0, remaining: 20 },
                        maternityLeave: balanceData.maternityLeave || { total: 182, used: 0, remaining: 182 },
                        paternityLeave: balanceData.paternityLeave || { total: 15, used: 0, remaining: 15 }
                    };
                    Object.keys(sanitizedBalance).forEach((key) => {
                        sanitizedBalance[key].used = Number(sanitizedBalance[key].used.toFixed(2));
                        sanitizedBalance[key].remaining = Number(sanitizedBalance[key].remaining.toFixed(2));
                    });
                    setLeaveBalance(sanitizedBalance);
                } else {
                    setError('Failed to refresh leave balance.');
                }
    
                const applicationsResponse = await fetch('http://localhost:8081/api/leaves', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (applicationsResponse.ok) {
                    const applicationsData = await applicationsResponse.json();
                    setLeaveApplications(applicationsData);
                } else {
                    setError('Failed to refresh leave applications.');
                }
            } else {
                let errorMessage = 'Failed to submit leave application';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonError) {
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                setError(errorMessage);
            }
        } catch (err) {
            console.error('Error submitting leave:', err);
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

    const leaveTypeMap = {
        CL: 'casualLeave',
        EL: 'earnedLeave',
        ML: 'maternityLeave',
        PL: 'paternityLeave',
        HALF_DAY: 'casualLeave'
    };

    const isLeaveTypeAvailable = (leaveType) => {
        const leaveKey = leaveTypeMap[leaveType];
        return leaveBalance[leaveKey]?.remaining > 0;
    };

    const totalRemainingLeaves = Number(
        (leaveBalance.casualLeave.remaining + leaveBalance.earnedLeave.remaining).toFixed(1)
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-blue-700 text-white py-4 px-6 shadow-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center">
                    <img
                        src="/Images/bisag_logo.png"
                        alt="BISAG-N Logo"
                        className="h-20 w-30 rounded-full"
                    />
                        <h1 className="ml-3 text-xl font-bold">BISAG-N Leave Management System</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center text-sm font-medium text-white bg-red-600 hover:bg-red-700 py-2 px-4 rounded-md"
                    >
                        Log Out
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Employee Dashboard</h2>

                    {userData && (
                        <p className="text-gray-600 mb-6">
                            Welcome, {userData.fullName}!
                        </p>
                    )}

                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">Total Leave Balance</h3>
                            <User className="w-8 h-8 text-purple-500" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Remaining Leaves</span>
                            <span className="font-bold text-xl text-green-600">{totalRemainingLeaves}</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-700">Casual Leave (CL)</h3>
                                <CalendarCheck className="w-8 h-8 text-blue-500" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Annual</span>
                                    <span className="font-bold text-xl">{leaveBalance.casualLeave.total}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Used</span>
                                    <span className="font-bold text-xl text-red-600">{leaveBalance.casualLeave.used.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Remaining</span>
                                    <span className="font-bold text-xl text-green-600">{leaveBalance.casualLeave.remaining.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-700">Earned Leave (EL)</h3>
                                <Calendar className="w-8 h-8 text-green-500" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Annual</span>
                                    <span className="font-bold text-xl">{leaveBalance.earnedLeave.total}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Used</span>
                                    <span className="font-bold text-xl text-red-600">{leaveBalance.earnedLeave.used.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Remaining</span>
                                    <span className="font-bold text-xl text-green-600">{leaveBalance.earnedLeave.remaining.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        {userData?.gender === 'Female' && (
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-700">Maternity Leave (ML)</h3>
                                    <Calendar className="w-8 h-8 text-pink-500" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total</span>
                                        <span className="font-bold text-xl">{leaveBalance.maternityLeave.total}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Used</span>
                                        <span className="font-bold text-xl text-red-600">{leaveBalance.maternityLeave.used}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Remaining</span>
                                        <span className="font-bold text-xl text-green-600">{leaveBalance.maternityLeave.remaining}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {userData?.gender === 'Male' && (
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-700">Paternity Leave (PL)</h3>
                                    <Calendar className="w-8 h-8 text-blue-500" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total</span>
                                        <span className="font-bold text-xl">{leaveBalance.paternityLeave.total}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Used</span>
                                        <span className="font-bold text-xl text-red-600">{leaveBalance.paternityLeave.used}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Remaining</span>
                                        <span className="font-bold text-xl text-green-600">{leaveBalance.paternityLeave.remaining}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Apply for Leave
                        </h3>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded mb-4">
                                {successMessage}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Leave Type
                                    </label>
                                    <select
                                        value={leaveFormData.leaveType}
                                        onChange={(e) => setLeaveFormData({ ...leaveFormData, leaveType: e.target.value, isHalfDay: e.target.value === 'HALF_DAY' })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        autoComplete="off"
                                    >
                                        <option value="CL" disabled={!isLeaveTypeAvailable('CL')}>
                                            Casual Leave (CL) {isLeaveTypeAvailable('CL') ? '' : '(Unavailable)'}
                                        </option>
                                        <option value="EL" disabled={!isLeaveTypeAvailable('EL')}>
                                            Earned Leave (EL) {isLeaveTypeAvailable('EL') ? '' : '(Unavailable)'}
                                        </option>
                                        {userData?.gender === 'Female' && (
                                            <option value="ML" disabled={!isLeaveTypeAvailable('ML')}>
                                                Maternity Leave (ML) {isLeaveTypeAvailable('ML') ? '' : '(Unavailable)'}
                                            </option>
                                        )}
                                        {userData?.gender === 'Male' && (
                                            <option value="PL" disabled={!isLeaveTypeAvailable('PL')}>
                                                Paternity Leave (PL) {isLeaveTypeAvailable('PL') ? '' : '(Unavailable)'}
                                            </option>
                                        )}
                                        <option value="HALF_DAY" disabled={!isLeaveTypeAvailable('HALF_DAY')}>
                                            Half-Day Leave {isLeaveTypeAvailable('HALF_DAY') ? '' : '(Unavailable)'}
                                        </option>
                                    </select>
                                    {leaveBalance[leaveTypeMap[leaveFormData.leaveType]]?.remaining <= 0 && (
                                        <div className="text-red-600 text-sm mt-1">
                                            No remaining {leaveFormData.leaveType} available.
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={leaveFormData.startDate}
                                        onChange={(e) => setLeaveFormData({ ...leaveFormData, startDate: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        autoComplete="off"
                                    />
                                </div>
                                {leaveFormData.leaveType !== 'ML' && leaveFormData.leaveType !== 'PL' && !leaveFormData.isHalfDay && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={leaveFormData.endDate}
                                            onChange={(e) => setLeaveFormData({ ...leaveFormData, endDate: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            autoComplete="off"
                                        />
                                    </div>
                                )}
                                {leaveFormData.leaveType !== 'ML' && leaveFormData.leaveType !== 'PL' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Half-Day Leave
                                        </label>
                                        <input
                                            type="checkbox"
                                            checked={leaveFormData.isHalfDay}
                                            onChange={(e) => setLeaveFormData({ ...leaveFormData, isHalfDay: e.target.checked, leaveType: e.target.checked ? 'HALF_DAY' : 'CL', endDate: e.target.checked ? '' : leaveFormData.endDate })}
                                            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </div>
                                )}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason
                                    </label>
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
                                disabled={
                                    isSubmitting ||
                                    !isLeaveTypeAvailable(leaveFormData.leaveType) ||
                                    !leaveFormData.startDate ||
                                    !leaveFormData.reason ||
                                    (leaveFormData.leaveType !== 'ML' &&
                                     leaveFormData.leaveType !== 'PL' &&
                                     !leaveFormData.isHalfDay &&
                                     !leaveFormData.endDate)
                                }
                                className="bg-blue-700 text-white py-2 pxs px-6 rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-gray-400"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                            <CalendarClock className="w-5 h-5 mr-2" />
                            Leave Application Status
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Start Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">End Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Applied On</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Remaining Leaves</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaveApplications.length > 0 ? (
                                        leaveApplications.map((application) => (
                                            <tr key={application.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4">{application.leaveType}</td>
                                                <td className="py-3 px-4">{new Date(application.startDate).toLocaleDateString()}</td>
                                                <td className="py-3 px-4">{application.isHalfDay ? 'Half-Day' : new Date(application.endDate).toLocaleDateString()}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                                                        {getStatusIcon(application.status)}
                                                        <span className="ml-1">{application.status}</span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">{new Date(application.appliedOn).toLocaleDateString()}</td>
                                                <td className="py-3 px-4">{leaveBalance[leaveTypeMap[application.leaveType]]?.remaining.toFixed(1)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-4 text-gray-500">
                                                No leave applications found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-blue-700 text-white py-4 text-center shadow-inner">
                <div className="max-w-7xl mx-auto px-4">
                    <p className="text-sm text-white">© 2025 BISAG-N. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}