import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CalendarCheck, FileText, Clock, CheckCircle, XCircle, AlertCircle, User, Menu, X, LogOut } from 'lucide-react';

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const navigate = useNavigate();

    const today = new Date().toISOString().split('T')[0];

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
                    headers: { 'Authorization': `Bearer ${token}` }
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
                    setError('Failed to fetch leave balance.');
                }

                const applicationsResponse = await fetch('http://localhost:8081/api/leaves', {
                    headers: { 'Authorization': `Bearer ${token}` }
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
            if (isNonWorkingDay(startDate)) return 0;
            return 0.5;
        }
        if (leaveType === 'ML') return 182;
        if (leaveType === 'PL') return 15;
        if (!endDate) return 0;

        const end = new Date(endDate);
        if (isNaN(end.getTime())) return 0;

        let currentDate = new Date(startDate);
        let days = 0;
        const countHolidays = leaveType === 'EL' || leaveType === 'ML' || leaveType === 'PL';
        while (currentDate <= end) {
            if (countHolidays || !isNonWorkingDay(currentDate)) days += 1;
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

        return leaveApplications.some((application) => {
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
            setError(`You already have a pending or approved leave application overlapping with the dates ${leaveFormData.startDate} to ${endDateForOverlap}.`);
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
                setSuccessMessage(`Leave application submitted successfully! Awaiting approval from ${userData?.reportingTo?.fullName || 'your reporting manager'}.`);
                setLeaveFormData({
                    leaveType: 'CL',
                    startDate: '',
                    endDate: '',
                    reason: ''
                });
                setLeaveDays(0);
                setActiveView('leave-applications');

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

                const applicationsResponse = await fetch('http://localhost:8081/api/leaves', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (applicationsResponse.ok) {
                    const applicationsData = await applicationsResponse.json();
                    setLeaveApplications(applicationsData);
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

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
        ...(userData?.gender?.toUpperCase() === 'FEMALE' ? [{
            key: 'maternity-leave',
            title: 'Maternity Leave (ML)',
            borderColor: 'border-pink-500',
            icon: <Calendar size={24} className="text-pink-500" />,
            details: [
                { label: 'Total', value: leaveBalance.maternityLeave.total },
                { label: 'Used', value: leaveBalance.maternityLeave.used.toFixed(1), textColor: 'text-red-600' },
                { label: 'Remaining', value: leaveBalance.maternityLeave.remaining.toFixed(1), textColor: 'text-green-600' }
            ]
        }] : []),
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
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Leave Balance Overview</h2>
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
                                    onChange={(e) => setLeaveFormData({ ...leaveFormData, leaveType: e.target.value, endDate: '' })}
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
                                {leaveBalance[leaveTypeMap[leaveFormData.leaveType]]?.remaining <= 0 && (
                                    <div className="text-red-600 text-sm mt-1">
                                        No remaining {leaveFormData.leaveType} available.
                                    </div>
                                )}
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
                                            onChange={(e) => setLeaveFormData({ ...leaveFormData, endDate: e.target.value })}
                                            min={leaveFormData.startDate || today}
                                            className={`pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${leaveFormData.endDate && leaveFormData.startDate && leaveFormData.endDate < leaveFormData.startDate ? 'border-red-500 bg-red-50' : ''}`}
                                            autoComplete="off"
                                        />
                                    </div>
                                    {leaveFormData.endDate && leaveFormData.startDate && leaveFormData.endDate < leaveFormData.startDate && (
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
                                        {leaveFormData.leaveType === 'ML' ? 'Maternity leave is fixed at 182 days.' : 'Paternity leave is fixed at 15 days.'}
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

    const renderLeaveApplicationsView = () => {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">My Leave Applications</h2>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    {leaveApplications.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Start Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">End Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Applied On</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Remaining</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Half-Day</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaveApplications.map((application) => (
                                        <tr key={application.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">{application.leaveType || 'N/A'}</td>
                                            <td className="py-3 px-4">{formatDate(application.startDate)}</td>
                                            <td className="py-3 px-4">
                                                {(application.leaveType === 'HALF_DAY_CL' || application.leaveType === 'HALF_DAY_EL' || application.leaveType === 'HALF_DAY_LWP')
                                                    ? `${formatDate(application.startDate)} (Half-Day)`
                                                    : application.endDate
                                                    ? formatDate(application.endDate)
                                                    : 'N/A'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                                                    {getStatusIcon(application.status)}
                                                    <span className="ml-1">{application.status || 'Unknown'}</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">{formatDate(application.appliedOn)}</td>
                                            <td className="py-3 px-4">{(application.remainingLeaves != null ? application.remainingLeaves : 0).toFixed(1)}</td>
                                            <td className="py-3 px-4">{application.isHalfDay ? 'Yes' : 'No'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-600">No leave applications found</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderMainContent = () => {
        if (error && (error.includes('Session expired') || error.includes('Failed to fetch user data'))) {
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
            case 'leave-applications':
                return renderLeaveApplicationsView();
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
                        <User size={20} className="mr-3" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveView('apply-leave')}
                        className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${
                            activeView === 'apply-leave' ? 'bg-blue-800' : 'hover:bg-blue-800'
                        }`}
                    >
                        <FileText size={20} className="mr-3" />
                        Apply for Leave
                    </button>
                    <button
                        onClick={() => setActiveView('leave-applications')}
                        className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${
                            activeView === 'leave-applications' ? 'bg-blue-800' : 'hover:bg-blue-800'
                        }`}
                    >
                        <CalendarCheck size={20} className="mr-3" />
                        Leave Applications
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
                        <h1 className="text-2xl font-semibold text-gray-900">Employee Dashboard</h1>
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