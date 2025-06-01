import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CalendarCheck, CalendarClock, FileText, Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';

export default function EmployeeDashboard() {
    const [userData, setUserData] = useState(null);
    const [leaveBalance, setLeaveBalance] = useState({
        casualLeave: { total: 12, used: 0, remaining: 12 },
        earnedLeave: { total: 20, used: 0, remaining: 20 },
        maternityLeave: { total: 182, used: 0, remaining: 182 },
        paternityLeave: { total: 15, used: 0, remaining: 15 },
        leaveWithoutPay: { total: 300, used: 0, remaining: 300 }
    });
    const [leaveApplications, setLeaveApplications] = useState([]);
    const [leaveFormData, setLeaveFormData] = useState({
        leaveType: 'CL',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [leaveDays, setLeaveDays] = useState(0);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Use current date dynamically (May 31, 2025)
    const today = new Date().toISOString().split('T')[0]; // 2025-05-31

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
                        paternityLeave: balanceData.paternityLeave || { total: 15, used: 0, remaining: 15 },
                        leaveWithoutPay: balanceData.leaveWithoutPay || { total: 300, used: 0, remaining: 300 }
                    };
                    Object.keys(sanitizedBalance).forEach((key) => {
                        sanitizedBalance[key].used = Number(sanitizedBalance[key].used.toFixed(1));
                        sanitizedBalance[key].remaining = Number(sanitizedBalance[key].remaining.toFixed(1));
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

    const isNonWorkingDay = (date) => {
        const day = new Date(date);
        if (isNaN(day.getTime())) return false; // Invalid date
        const dayOfWeek = day.getDay(); // 0 = Sunday, 6 = Saturday
        if (dayOfWeek === 0) return true; // Sunday
        if (dayOfWeek === 6) {
            // Check for second or fourth Saturday
            const dayOfMonth = day.getDate();
            const weekOfMonth = Math.floor((dayOfMonth - 1) / 7) + 1;
            return weekOfMonth === 2 || weekOfMonth === 4;
        }
        return false;
    };

    const calculateLeaveDays = (startDate, endDate, leaveType) => {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) return 0; // Invalid start date

        if (leaveType === 'HALF_DAY_CL' || leaveType === 'HALF_DAY_EL' || leaveType === 'HALF_DAY_LWP') {
            if (isNonWorkingDay(startDate)) {
                return 0; // Will trigger error in validation
            }
            return 0.5;
        }
        if (leaveType === 'ML') {
            return 182; // Fixed 182 days for maternity leave
        }
        if (leaveType === 'PL') {
            return 15; // Fixed 15 days for paternity leave
        }
        if (!endDate) return 0;

        const end = new Date(endDate);
        if (isNaN(end.getTime())) return 0; // Invalid end date

        let currentDate = new Date(startDate);
        let days = 0;

        // For EL, ML, and PL, count all days; for CL and LWP, exclude non-working days
        const countHolidays = leaveType === 'EL' || leaveType === 'ML' || leaveType === 'PL';

        while (currentDate <= end) {
            if (countHolidays || !isNonWorkingDay(currentDate)) {
                days += 1; // Count all days for EL, ML, PL; only working days for CL and LWP
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return days;
    };

    const calculateEndDate = (startDate, leaveType) => {
        if (!startDate) return '';
        const start = new Date(startDate);
        if (isNaN(start.getTime())) return ''; // Invalid date
        if (leaveType === 'ML') {
            start.setDate(start.getDate() + 181); // 182 days total (start + 181)
        } else if (leaveType === 'PL') {
            start.setDate(start.getDate() + 14); // 15 days total (start + 14)
        } else {
            return leaveFormData.endDate; // Return existing end date for other leave types
        }
        return start.toISOString().split('T')[0];
    };

    const hasOverlappingLeaves = (startDate, endDate, leaveType) => {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) return false; // Invalid start date
        const newStart = start;
        const newEnd = (leaveType === 'HALF_DAY_CL' || leaveType === 'HALF_DAY_EL' || leaveType === 'HALF_DAY_LWP') ? new Date(startDate) : new Date(endDate);
        if (isNaN(newEnd.getTime())) return false; // Invalid end date

        const overlapping = leaveApplications.some((application) => {
            if (application.status === 'REJECTED') return false;

            const existingStart = new Date(application.startDate);
            const existingEnd = (application.leaveType === 'HALF_DAY_CL' || application.leaveType === 'HALF_DAY_EL' || application.leaveType === 'HALF_DAY_LWP')
                ? new Date(application.startDate)
                : new Date(application.endDate);

            if (isNaN(existingStart.getTime()) || isNaN(existingEnd.getTime())) return false;

            const isOverlapping = existingStart <= newEnd && existingEnd >= newStart;
            if (isOverlapping) {
                console.log(`Overlap detected with application: ${application.leaveType} from ${application.startDate} to ${application.endDate}, Status: ${application.status}`);
            }
            return isOverlapping;
        });

        return overlapping;
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
            setError('Start date cannot be in the past');
            setIsSubmitting(false);
            return;
        }

        if (!leaveFormData.startDate || !leaveFormData.reason) {
            setError('Please fill all required fields');
            setIsSubmitting(false);
            return;
        }

        if (leaveFormData.leaveType !== 'HALF_DAY_CL' && leaveFormData.leaveType !== 'HALF_DAY_EL' && leaveFormData.leaveType !== 'HALF_DAY_LWP' && leaveFormData.leaveType !== 'ML' && leaveFormData.leaveType !== 'PL' && !leaveFormData.endDate) {
            setError('Please provide an end date');
            setIsSubmitting(false);
            return;
        }

        if (leaveFormData.endDate && new Date(leaveFormData.endDate) < new Date(leaveFormData.startDate)) {
            setError('End date cannot be earlier than start date');
            setIsSubmitting(false);
            return;
        }

        if ((leaveFormData.leaveType === 'HALF_DAY_CL' || leaveFormData.leaveType === 'HALF_DAY_EL' || leaveFormData.leaveType === 'HALF_DAY_LWP') && isNonWorkingDay(leaveFormData.startDate)) {
            setError('Half-day leave cannot be applied on a non-working day (second/fourth Saturday or Sunday)');
            setIsSubmitting(false);
            return;
        }

        const leaveDays = calculateLeaveDays(leaveFormData.startDate, leaveFormData.endDate, leaveFormData.leaveType);

        if (leaveDays === 0) {
            setError('No working days selected for leave');
            setIsSubmitting(false);
            return;
        }

        const endDateForOverlap = (leaveFormData.leaveType === 'HALF_DAY_CL' || leaveFormData.leaveType === 'HALF_DAY_EL' || leaveFormData.leaveType === 'HALF_DAY_LWP')
            ? leaveFormData.startDate
            : leaveFormData.endDate;
        if (hasOverlappingLeaves(leaveFormData.startDate, endDateForOverlap, leaveFormData.leaveType)) {
            setError(`You already have a pending or approved leave application overlapping with the dates ${leaveFormData.startDate} to ${endDateForOverlap}. Please check your existing applications and wait until they are processed or rejected.`);
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
                setError(`You don’t have enough ${leaveKey.replace(/([A-Z])/g, ' $1').toLowerCase()}. Remaining: ${remainingLeaves}`);
                setIsSubmitting(false);
                return;
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
                const newApplication = await response.json();
                setSuccessMessage(`Leave application submitted successfully! Awaiting approval from ${userData?.reportingTo?.fullName || 'your reporting manager'}.`);
                setLeaveFormData({
                    leaveType: 'CL',
                    startDate: '',
                    endDate: '',
                    reason: ''
                });
                setLeaveDays(0);

                // Refresh leave balance and applications
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
                        paternityLeave: balanceData.paternityLeave || { total: 15, used: 0, remaining: 15 },
                        leaveWithoutPay: balanceData.leaveWithoutPay || { total: 300, used: 0, remaining: 300 }
                    };
                    Object.keys(sanitizedBalance).forEach((key) => {
                        sanitizedBalance[key].used = Number(sanitizedBalance[key].used.toFixed(1));
                        sanitizedBalance[key].remaining = Number(sanitizedBalance[key].remaining.toFixed(1));
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
                if (response.status === 401) {
                    setError('Session expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    navigate('/');
                    setIsSubmitting(false);
                    return;
                }
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
        HALF_DAY_CL: 'casualLeave',
        HALF_DAY_EL: 'earnedLeave',
        LWP: 'leaveWithoutPay',
        HALF_DAY_LWP: 'leaveWithoutPay'
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
                            Welcome, {userData.fullName}! Your leaves will be sent to {userData.reportingTo?.fullName || 'your reporting manager'} for approval.
                        </p>
                    )}

                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">Total Leave Balance</h3>
                            <User className="w-8 h-8 text-purple-500" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Remaining Leaves (CL + EL)</span>
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

                        {userData?.gender?.toUpperCase() === 'FEMALE' && (
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
                                        <span className="font-bold text-xl text-red-600">{leaveBalance.maternityLeave.used.toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Remaining</span>
                                        <span className="font-bold text-xl text-green-600">{leaveBalance.maternityLeave.remaining.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {userData?.gender?.toUpperCase() === 'MALE' && (
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
                                        <span className="font-bold text-xl text-red-600">{leaveBalance.paternityLeave.used.toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Remaining</span>
                                        <span className="font-bold text-xl text-green-600">{leaveBalance.paternityLeave.remaining.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-700">Leave Without Pay (LWP)</h3>
                                <Calendar className="w-8 h-8 text-gray-500" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Annual</span>
                                    <span className="font-bold text-xl">{leaveBalance.leaveWithoutPay.total}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Used</span>
                                    <span className="font-bold text-xl text-red-600">{leaveBalance.leaveWithoutPay.used.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Remaining</span>
                                    <span className="font-bold text-xl text-green-600">{leaveBalance.leaveWithoutPay.remaining.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
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
                                        onChange={(e) => setLeaveFormData({ ...leaveFormData, leaveType: e.target.value, endDate: '' })}
                                        className="flex w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                                        min={today}
                                        className={`flex w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 ${leaveFormData.startDate && leaveFormData.startDate < today ? 'border-red-500 bg-red-50' : ''}`}
                                        autoComplete="off"
                                        required
                                    />
                                    {leaveFormData.startDate && leaveFormData.startDate < today && (
                                        <div className="text-red-600 text-sm mt-1">
                                            Past dates are not allowed.
                                        </div>
                                    )}
                                </div>
                                {(leaveFormData.leaveType !== 'HALF_DAY_CL' && leaveFormData.leaveType !== 'HALF_DAY_EL' && leaveFormData.leaveType !== 'HALF_DAY_LWP' && leaveFormData.leaveType !== 'ML' && leaveFormData.leaveType !== 'PL') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={leaveFormData.endDate}
                                            onChange={(e) => setLeaveFormData({ ...leaveFormData, endDate: e.target.value })}
                                            min={leaveFormData.startDate || today}
                                            className={`flex w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 ${leaveFormData.endDate && leaveFormData.startDate && leaveFormData.endDate < leaveFormData.startDate ? 'border-red-500 bg-red-50' : ''}`}
                                            autoComplete="off"
                                            required
                                        />
                                        {leaveFormData.endDate && leaveFormData.startDate && leaveFormData.endDate < leaveFormData.startDate && (
                                            <div className="text-red-600 text-sm mt-1">
                                                End date cannot be before start date.
                                            </div>
                                        )}
                                    </div>
                                )}
                                {(leaveFormData.leaveType === 'ML' || leaveFormData.leaveType === 'PL') && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={leaveFormData.endDate}
                                            readOnly
                                            className="flex w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                                            autoComplete="off"
                                        />
                                        <p className="text-sm text-gray-600 mt-1">
                                            {leaveFormData.leaveType === 'ML' ? 'Maternity leave is fixed at 182 days.' : 'Paternity leave is fixed at 15 days.'}
                                        </p>
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
                                        className="flex w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
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
                                className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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

                    <div className="bg-white rounded-lg shadow p-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                            <CalendarClock className="mr-2 h-6 w-4" />
                            Leave Application Status
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Type</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Start Date</th>
                                        <th className="px-6 py-4 text-left text-sm font-medium">End Date</th>
                                        <th className="px-2 py-4 text-left text-sm font-medium">Status</th>
                                        <th className="px-10 py-4 text-left text-sm font-medium">Applied On</th>
                                        <th className="px-6 text-left text-sm font-medium">Remaining</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaveApplications.length > 0 ? (
                                        leaveApplications.map((application) => (
                                            <tr key={application.id} className="border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm">{application.leaveType || 'N/A'}</td>
                                                <td className="px-2 py-4 text-sm">
                                                    {application.startDate ? new Date(application.startDate).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-2 py-4 text-sm">
                                                    {(application.leaveType === 'HALF_DAY_CL' || application.leaveType === 'HALF_DAY_EL' || application.leaveType === 'HALF_DAY_LWP')
                                                        ? 'Half-Day'
                                                        : application.endDate
                                                        ? new Date(application.endDate).toLocaleDateString()
                                                        : 'N/A'}
                                                </td>
                                                <td className="px-4">
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                                                        {getStatusIcon(application.status)}
                                                        <span>{application.status || 'Unknown'}</span>
                                                    </span>
                                                </td>
                                                <td className="px-10 py-4 text-sm">
                                                    {application.appliedOn ? new Date(application.appliedOn).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-center">
                                                    {(application.remainingLeaves != null ? application.remainingLeaves : 0).toFixed(1)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
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

            <footer className="bg-blue-600 text-white py-3 text-center shadow-md">
                <div className="max-w-7xl mx-auto px-4">
                    <p className="text-sm">© 2025 BISAG-NK. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}