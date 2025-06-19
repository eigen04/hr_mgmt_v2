import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CalendarCheck, FileText, Clock, CheckCircle, XCircle, AlertCircle, User, Menu, X, LogOut, Users } from 'lucide-react';

export default function GenericDashboard() {
    const [userData, setUserData] = useState(null);
    const [leaveBalance, setLeaveBalance] = useState({
        casualLeave: { total: 12, used: 0, remaining: 0 },
        earnedLeave: { total: 20, used: 0, remaining: 0, usedFirstHalf: 0, usedSecondHalf: 0, carryover: 0 },
        maternityLeave: { total: 182, used: 0, remaining: 182 },
        paternityLeave: { total: 15, used: 0, remaining: 15 },
        leaveWithoutPay: { total: 300, used: 0, remaining: 300 },
    });
    const [leaveApplications, setLeaveApplications] = useState([]);
    const [subordinates, setSubordinates] = useState([]);
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [leaveFormData, setLeaveFormData] = useState({
        leaveType: 'CL',
        startDate: '',
        endDate: '',
        reason: '',
    });
    const [leaveDays, setLeaveDays] = useState(0);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const navigate = useNavigate();

    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const EL_FIRST_HALF = 10;
    const EL_SECOND_HALF = 10;

    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError('Please log in to continue');
                    navigate('/');
                    return;
                }

                const response = await fetch('http://localhost:8081/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    const joinDate = new Date(data.joinDate);
                    const joinYear = joinDate.getFullYear();
                    const joinMonth = joinDate.getMonth() + 1;
                    const monthsAccrued = currentYear === joinYear
                        ? Math.max(0, currentMonth - joinMonth + 1)
                        : currentMonth;
                    data.accruedCl = Math.min(12, monthsAccrued);
                    setUserData(data);

                    const subordinatesResponse = await fetch('http://localhost:8081/api/users/subordinates', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (subordinatesResponse.ok) {
                        const subordinatesData = await subordinatesResponse.json();
                        console.log('Subordinates data:', subordinatesData); // Debug log
                        setSubordinates(subordinatesData);
                    } else {
                        console.log('Subordinates fetch failed:', subordinatesResponse.status);
                    }

                    const pendingResponse = await fetch('http://localhost:8081/api/leaves/pending', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (pendingResponse.ok) {
                        const pendingData = await pendingResponse.json();
                        console.log('Pending leaves data:', pendingData); // Debug log
                        setPendingLeaves(pendingData);
                    } else {
                        console.log('Pending leaves fetch failed:', pendingResponse.status);
                    }
                } else if (response.status === 401) {
                    setError('Session expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    navigate('/');
                } else {
                    setError('Failed to fetch user data.');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('An error occurred. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        const fetchLeaveData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) return;

                const balanceResponse = await fetch('http://localhost:8081/api/leaves/balance', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (balanceResponse.ok) {
                    const balanceData = await balanceResponse.json();
                    const sanitizedBalance = {
                        casualLeave: balanceData.casualLeave || { total: 12, used: 0, remaining: 0 },
                        earnedLeave: balanceData.earnedLeave || {
                            total: 20, used: 0, remaining: 0, usedFirstHalf: 0, usedSecondHalf: 0, carryover: 0,
                        },
                        maternityLeave: balanceData.maternityLeave || { total: 182, used: 0, remaining: 182 },
                        paternityLeave: balanceData.paternityLeave || { total: 15, used: 0, remaining: 15 },
                        leaveWithoutPay: balanceData.leaveWithoutPay || { total: 300, used: 0, remaining: 300 },
                    };
                    Object.keys(sanitizedBalance).forEach((key) => {
                        sanitizedBalance[key].used = Number((sanitizedBalance[key].used || 0).toFixed(1));
                        sanitizedBalance[key].remaining = Number((sanitizedBalance[key].remaining || 0).toFixed(1));
                        if (key === 'earnedLeave') {
                            sanitizedBalance[key].usedFirstHalf = Number((sanitizedBalance[key].usedFirstHalf || 0).toFixed(1));
                            sanitizedBalance[key].usedSecondHalf = Number((sanitizedBalance[key].usedSecondHalf || 0).toFixed(1));
                            sanitizedBalance[key].carryover = Number((sanitizedBalance[key].carryover || 0).toFixed(1));
                        }
                    });
                    setLeaveBalance(sanitizedBalance);
                }

                const applicationsResponse = await fetch('http://localhost:8081/api/leaves', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (applicationsResponse.ok) {
                    const applicationsData = await applicationsResponse.json();
                    setLeaveApplications(applicationsData);
                }
            } catch (err) {
                console.error('Error fetching leave data:', err);
                setError('An error occurred while fetching leave data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
        fetchLeaveData();
    }, [navigate]);

    // Rest of the component remains unchanged
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

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
        const newEnd = (leaveType === 'HALF_DAY_CL' || leaveType === 'HALF_DAY_EL' || leaveType === 'HALF_DAY_LWP')
            ? new Date(startDate)
            : new Date(endDate);
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

    const calculateAvailableClForMonth = (applicationMonth) => {
        const joinDate = new Date(userData?.joinDate);
        const joinYear = joinDate.getFullYear();
        const joinMonth = joinDate.getMonth() + 1;
        let totalClAccrued = 0;
        const endMonth = joinYear === currentYear ? Math.min(12, applicationMonth) : applicationMonth;
        const startMonth = joinYear === currentYear ? joinMonth : 1;

        for (let month = startMonth; month <= endMonth; month++) {
            totalClAccrued += 1;
        }

        const totalUsedCl = leaveApplications
            .filter(app => (app.leaveType === 'CL' || app.leaveType === 'HALF_DAY_CL') &&
                (app.status === 'APPROVED' || app.status === 'PENDING'))
            .reduce((total, app) => total + calculateLeaveDays(app.startDate, app.endDate, app.leaveType), 0);

        return Math.max(0, totalClAccrued - totalUsedCl);
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

        if (
            leaveFormData.leaveType !== 'HALF_DAY_CL' &&
            leaveFormData.leaveType !== 'HALF_DAY_EL' &&
            leaveFormData.leaveType !== 'HALF_DAY_LWP' &&
            leaveFormData.leaveType !== 'ML' &&
            leaveFormData.leaveType !== 'PL' &&
            !leaveFormData.endDate
        ) {
            setError('Please provide an end date');
            setIsSubmitting(false);
            return;
        }

        if (
            leaveFormData.endDate &&
            new Date(leaveFormData.endDate) < new Date(leaveFormData.startDate)
        ) {
            setError('End date cannot be earlier than start date');
            setIsSubmitting(false);
            return;
        }

        if (
            (leaveFormData.leaveType === 'HALF_DAY_CL' ||
                leaveFormData.leaveType === 'HALF_DAY_EL' ||
                leaveFormData.leaveType === 'HALF_DAY_LWP') &&
            isNonWorkingDay(leaveFormData.startDate)
        ) {
            setError('Half-day leave cannot be applied on a non-working day');
            setIsSubmitting(false);
            return;
        }

        const leaveDays = calculateLeaveDays(
            leaveFormData.startDate,
            leaveFormData.endDate,
            leaveFormData.leaveType
        );
        if (leaveDays === 0) {
            setError('No working days selected for leave');
            setIsSubmitting(false);
            return;
        }

        const endDateForOverlap =
            leaveFormData.leaveType === 'HALF_DAY_CL' ||
            leaveFormData.leaveType === 'HALF_DAY_EL' ||
            leaveFormData.leaveType === 'HALF_DAY_LWP'
                ? leaveFormData.startDate
                : leaveFormData.endDate;
        if (hasOverlappingLeaves(leaveFormData.startDate, endDateForOverlap, leaveFormData.leaveType)) {
            setError(`You already have a leave application overlapping with the dates ${leaveFormData.startDate} to ${endDateForOverlap}.`);
            setIsSubmitting(false);
            return;
        }

        if (leaveFormData.leaveType === 'CL' || leaveFormData.leaveType === 'HALF_DAY_CL') {
            const startDate = new Date(leaveFormData.startDate);
            const applicationMonth = startDate.getMonth() + 1;
            const applicationYear = startDate.getFullYear();
            const joinDate = new Date(userData?.joinDate);
            const joinYear = joinDate.getFullYear();
            const joinMonth = joinDate.getMonth() + 1;

            if (applicationYear > currentYear) {
                setError('Advance CL application is only allowed within the current year');
                setIsSubmitting(false);
                return;
            }

            if (joinYear === currentYear && applicationMonth < joinMonth) {
                setError('Cannot apply CL for a month before your joining date');
                setIsSubmitting(false);
                return;
            }

            const availableClForMonth = calculateAvailableClForMonth(applicationMonth);
            const totalUsedCl = leaveApplications
                .filter(app => (app.leaveType === 'CL' || app.leaveType === 'HALF_DAY_CL') &&
                    (app.status === 'APPROVED' || app.status === 'PENDING'))
                .reduce((total, app) => total + calculateLeaveDays(app.startDate, app.endDate, app.leaveType), 0);
            const totalClCommitted = totalUsedCl + leaveDays;

            if (applicationMonth <= currentMonth) {
                const accruedClUpToCurrent = userData?.accruedCl || 0;
                if (totalClCommitted > accruedClUpToCurrent) {
                    setError(`Total CL exceeds accrued CL: ${accruedClUpToCurrent.toFixed(1)}`);
                    setIsSubmitting(false);
                    return;
                }
            } else {
                if (totalClCommitted > 12) {
                    setError('Total CL exceeds annual limit of 12 days');
                    setIsSubmitting(false);
                    return;
                }
            }

            if (availableClForMonth < leaveDays) {
                setError(`Insufficient CL balance for ${startDate.toLocaleString('default', { month: 'long' })}: ${availableClForMonth.toFixed(1)}`);
                setIsSubmitting(false);
                return;
            }
        }

        if (leaveFormData.leaveType === 'EL' || leaveFormData.leaveType === 'HALF_DAY_EL') {
            const startDate = new Date(leaveFormData.startDate);
            const applicationMonth = startDate.getMonth() + 1;
            const totalEligible = EL_FIRST_HALF + EL_SECOND_HALF;
            const totalUsed = leaveBalance.earnedLeave.usedFirstHalf + leaveBalance.earnedLeave.usedSecondHalf;

            if (applicationMonth <= 6 && currentMonth <= 6) {
                const firstHalfAvailable = EL_FIRST_HALF - leaveBalance.earnedLeave.usedSecondHalf;
                if (leaveBalance.earnedLeave.usedFirstHalf + leaveDays > firstHalfAvailable) {
                    setError(`Cannot apply more than ${firstHalfAvailable.toFixed(1)} EL days in the first half`);
                    setIsSubmitting(false);
                    return;
                }
            } else if (applicationMonth > 6 && currentMonth <= 6) {
                if (totalUsed + leaveDays > totalEligible) {
                    setError(`Cannot apply more than ${(totalEligible - totalUsed).toFixed(1)} EL days in advance`);
                    setIsSubmitting(false);
                    return;
                }
            } else if (applicationMonth > 6 && currentMonth > 6) {
                const secondHalfEligible = EL_SECOND_HALF + leaveBalance.earnedLeave.carryover;
                if (leaveBalance.earnedLeave.usedSecondHalf + leaveDays > secondHalfEligible) {
                    setError(`Cannot apply more than ${secondHalfEligible.toFixed(1)} EL days in the second half`);
                    setIsSubmitting(false);
                    return;
                }
                if (totalUsed + leaveDays > totalEligible) {
                    setError(`Total EL usage cannot exceed ${totalEligible.toFixed(1)} days annually`);
                    setIsSubmitting(false);
                    return;
                }
            } else if (applicationMonth <= 6 && currentMonth > 6) {
                setError('Cannot apply EL for first half when current month is in second half');
                setIsSubmitting(false);
                return;
            }
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
                HALF_DAY_LWP: 'leaveWithoutPay',
            };

            if (!['EL', 'HALF_DAY_EL', 'CL', 'HALF_DAY_CL'].includes(leaveFormData.leaveType)) {
                const leaveKey = leaveTypeMap[leaveFormData.leaveType];
                const remainingLeaves = leaveBalance[leaveKey]?.remaining || 0;
                if (remainingLeaves < leaveDays) {
                    setError(`Insufficient ${leaveKey.replace(/([A-Z])/g, ' $1').trim()} balance: ${remainingLeaves}`);
                    setIsSubmitting(false);
                    return;
                }
            }

            const endDate =
                leaveFormData.leaveType === 'HALF_DAY_CL' ||
                leaveFormData.leaveType === 'HALF_DAY_EL' ||
                leaveFormData.leaveType === 'HALF_DAY_LWP'
                    ? leaveFormData.startDate
                    : leaveFormData.endDate;

            const response = await fetch('http://localhost:8081/api/leaves', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    leaveType: leaveFormData.leaveType,
                    startDate: leaveFormData.startDate,
                    endDate,
                    reason: leaveFormData.reason,
                    isHalfDay: leaveFormData.leaveType === 'HALF_DAY_CL' ||
                        leaveFormData.leaveType === 'HALF_DAY_EL' ||
                        leaveFormData.leaveType === 'HALF_DAY_LWP',
                }),
            });

            if (response.ok) {
                const startDate = new Date(leaveFormData.startDate);
                const applicationMonth = startDate.getMonth() + 1;
                let message = `Leave application submitted successfully! Awaiting approval from ${
                    userData?.reportingTo?.fullName || 'your reporting manager'
                }.`;
                if (
                    (leaveFormData.leaveType === 'CL' || leaveFormData.leaveType === 'HALF_DAY_CL') &&
                    applicationMonth > currentMonth
                ) {
                    const totalClCommitted = leaveApplications
                        .filter(app => (app.leaveType === 'CL' || app.leaveType === 'HALF_DAY_CL') &&
                            (app.status === 'APPROVED' || app.status === 'PENDING'))
                        .reduce((total, app) => total + calculateLeaveDays(app.startDate, app.endDate, app.leaveType), 0) + leaveDays;
                    const remainingTotal = leaveBalance.casualLeave.total - totalClCommitted;
                    message += ` Total CL balance after approval: ${remainingTotal.toFixed(1)} days.`;
                }
                if (
                    (leaveFormData.leaveType === 'EL' || leaveFormData.leaveType === 'HALF_DAY_EL') &&
                    applicationMonth > 6 &&
                    currentMonth <= 6
                ) {
                    const remainingTotal =
                        leaveBalance.earnedLeave.total -
                        leaveBalance.earnedLeave.usedFirstHalf -
                        leaveBalance.earnedLeave.usedSecondHalf -
                        leaveDays;
                    message += ` Total EL balance after approval: ${remainingTotal.toFixed(1)} days.`;
                }

                setSuccessMessage(message);
                setLeaveFormData({
                    leaveType: 'CL',
                    startDate: '',
                    endDate: '',
                    reason: '',
                });
                setLeaveDays(0);
                setActiveView('leave-applications');

                const balanceResponse = await fetch('http://localhost:8081/api/leaves/balance', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (balanceResponse.ok) {
                    const balanceData = await balanceResponse.json();
                    const sanitizedBalance = {
                        casualLeave: balanceData.casualLeave || { total: 12, used: 0, remaining: 0 },
                        earnedLeave: balanceData.earnedLeave || {
                            total: 20, used: 0, remaining: 0, usedFirstHalf: 0, usedSecondHalf: 0, carryover: 0,
                        },
                        maternityLeave: balanceData.maternityLeave || { total: 182, used: 0, remaining: 182 },
                        paternityLeave: balanceData.paternityLeave || { total: 15, used: 0, remaining: 15 },
                        leaveWithoutPay: balanceData.leaveWithoutPay || { total: 300, used: 0, remaining: 300 },
                    };
                    Object.keys(sanitizedBalance).forEach((key) => {
                        sanitizedBalance[key].used = Number((sanitizedBalance[key].used || 0).toFixed(1));
                        sanitizedBalance[key].remaining = Number((sanitizedBalance[key].remaining || 0).toFixed(1));
                        if (key === 'earnedLeave') {
                            sanitizedBalance[key].usedFirstHalf = Number((sanitizedBalance[key].usedFirstHalf || 0).toFixed(1));
                            sanitizedBalance[key].usedSecondHalf = Number((sanitizedBalance[key].usedSecondHalf || 0).toFixed(1));
                            sanitizedBalance[key].carryover = Number((sanitizedBalance[key].carryover || 0).toFixed(1));
                        }
                    });
                    setLeaveBalance(sanitizedBalance);
                }

                const applicationsResponse = await fetch('http://localhost:8081/api/leaves', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (applicationsResponse.ok) {
                    const applicationsData = await applicationsResponse.json();
                    setLeaveApplications(applicationsData);
                }
            } else {
                let errorMessage = 'Failed to submit leave application';
                if (response.status === 401) {
                    setError('Session expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    navigate('/');
                } else {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (jsonError) {
                        errorMessage = `Server error: ${response.status} ${response.statusText}`;
                    }
                    setError(errorMessage);
                }
            }
        } catch (err) {
            console.error('Error submitting leave:', err);
            setError('An error occurred while submitting the application');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLeaveAction = async (leaveId, action, reason = '') => {
        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Session expired. Please log in again.');
                localStorage.removeItem('authToken');
                navigate('/');
                setIsSubmitting(false);
                return;
            }

            const response = await fetch(`http://localhost:8081/api/leaves/${action}/${leaveId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason }),
            });

            if (response.ok) {
                setSuccessMessage(`Leave ${action}ed successfully!`);
                const pendingResponse = await fetch('http://localhost:8081/api/leaves/pending', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (pendingResponse.ok) {
                    const pendingData = await pendingResponse.json();
                    setPendingLeaves(pendingData);
                }
                setActiveView('pending-leaves');
            } else {
                let errorMessage = `Failed to ${action} leave`;
                if (response.status === 401) {
                    setError('Session expired. Please log in again.');
                    localStorage.removeItem('authToken');
                    navigate('/');
                } else {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (jsonError) {
                        errorMessage = `Server error: ${response.status} ${response.statusText}`;
                    }
                    setError(errorMessage);
                }
            }
        } catch (err) {
            console.error(`Error ${action}ing leave:`, err);
            setError(`An error occurred while ${action}ing the leave`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock className="w-5 h-5 text-yellow-500" />;
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

    const leaveTypeMap = {
        CL: 'casualLeave',
        EL: 'earnedLeave',
        ML: 'maternityLeave',
        PL: 'paternityLeave',
        HALF_DAY_CL: 'casualLeave',
        HALF_DAY_EL: 'earnedLeave',
        LWP: 'leaveWithoutPay',
        HALF_DAY_LWP: 'leaveWithoutPay',
    };

    const isLeaveTypeAvailable = (leaveType) => {
        if (leaveType === 'EL' || leaveType === 'HALF_DAY_EL') {
            const totalEligible = EL_FIRST_HALF + EL_SECOND_HALF;
            const totalUsed = leaveBalance.earnedLeave.usedFirstHalf + leaveBalance.earnedLeave.usedSecondHalf;
            if (currentMonth <= 6) {
                return leaveBalance.earnedLeave.usedFirstHalf < EL_FIRST_HALF - leaveBalance.earnedLeave.usedSecondHalf ||
                    totalUsed < totalEligible;
            }
            const secondHalfEligible = EL_SECOND_HALF + leaveBalance.earnedLeave.carryover;
            return leaveBalance.earnedLeave.usedSecondHalf < secondHalfEligible;
        }

        const leaveKey = leaveTypeMap[leaveType];
        return leaveBalance[leaveKey]?.remaining > 0;
    };

    const totalRemainingLeaves = Number(
        (leaveBalance.casualLeave.remaining + leaveBalance.earnedLeave.remaining).toFixed(1)
    );

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toISOString().split('T')[0];
    };

    const leaveBalanceMetrics = [
        {
            key: 'total-leave-balance',
            title: 'Total Leave Balance (CL + EL)',
            value: totalRemainingLeaves,
            borderColor: 'border-purple-500',
            icon: <User size={24} className="text-purple-500" />,
            details: [{ label: 'Total Remaining', value: totalRemainingLeaves }],
        },
        {
            key: 'casual-leave',
            title: 'Casual Leave (CL)',
            borderColor: 'border-blue-500',
            icon: <CalendarCheck size={24} className="text-blue-500" />,
            details: [
                { label: 'Total Annual', value: leaveBalance.casualLeave.total },
                { label: 'Accrued This Year', value: userData?.accruedCl || 0, textColor: 'text-blue-600' },
                { label: 'Used', value: leaveBalance.casualLeave.used.toFixed(1), textColor: 'text-red-600' },
                { label: 'Remaining', value: leaveBalance.casualLeave.remaining.toFixed(1), textColor: 'text-green-600' },
            ],
            note: leaveApplications.some(app => (app.leaveType === 'CL' || app.leaveType === 'HALF_DAY_CL') &&
                app.status === 'PENDING' && new Date(app.startDate).getMonth() + 1 > currentMonth)
                ? `Pending advance CL applications exist. Total CL after approval: ${(leaveBalance.casualLeave.total - leaveApplications
                    .filter(app => (app.leaveType === 'CL' || app.leaveType === 'HALF_DAY_CL') &&
                        (app.status === 'APPROVED' || app.status === 'PENDING'))
                    .reduce((total, app) => total + calculateLeaveDays(app.startDate, app.endDate, app.leaveType), 0)).toFixed(1)} days.`
                : null,
        },
        {
            key: 'earned-leave',
            title: 'Earned Leave (EL)',
            borderColor: 'border-green-500',
            icon: <Calendar size={24} className="text-green-500" />,
            details: [
                { label: 'Total Annual', value: leaveBalance.earnedLeave.total },
                { label: 'Carryover', value: leaveBalance.earnedLeave.carryover.toFixed(1), textColor: 'text-blue-600' },
                { label: 'Used First Half', value: leaveBalance.earnedLeave.usedFirstHalf.toFixed(1), textColor: 'text-red-600' },
                { label: 'Used Second Half', value: leaveBalance.earnedLeave.usedSecondHalf.toFixed(1), textColor: 'text-red-600' },
                { label: 'Remaining', value: leaveBalance.earnedLeave.remaining.toFixed(1), textColor: 'text-green-600' },
            ],
            note: currentMonth <= 6 && leaveBalance.earnedLeave.usedSecondHalf > 0
                ? `Pending advance EL: ${leaveBalance.earnedLeave.usedSecondHalf.toFixed(1)} days. Total EL balance after approval: ${(leaveBalance.earnedLeave.total - leaveBalance.earnedLeave.usedFirstHalf - leaveBalance.earnedLeave.usedSecondHalf).toFixed(1)} days.`
                : null,
        },
        ...(userData?.gender?.toUpperCase() === 'FEMALE'
            ? [{
                key: 'maternity-leave',
                title: 'Maternity Leave (ML)',
                borderColor: 'border-pink-500',
                icon: <Calendar size={24} className="text-pink-500" />,
                details: [
                    { label: 'Total', value: leaveBalance.maternityLeave.total },
                    { label: 'Used', value: leaveBalance.maternityLeave.used.toFixed(1), textColor: 'text-red-600' },
                    { label: 'Remaining', value: leaveBalance.maternityLeave.remaining.toFixed(1), textColor: 'text-green-600' },
                ],
            }]
            : []),
        ...(userData?.gender?.toUpperCase() === 'MALE'
            ? [{
                key: 'paternity-leave',
                title: 'Paternity Leave (PL)',
                borderColor: 'border-blue-500',
                icon: <Calendar size={24} className="text-blue-500" />,
                details: [
                    { label: 'Total', value: leaveBalance.paternityLeave.total },
                    { label: 'Used', value: leaveBalance.paternityLeave.used.toFixed(1), textColor: 'text-red-600' },
                    { label: 'Remaining', value: leaveBalance.paternityLeave.remaining.toFixed(1), textColor: 'text-green-600' },
                ],
            }]
            : []),
        {
            key: 'leave-without-pay',
            title: 'Leave Without Pay (LWP)',
            borderColor: 'border-gray-500',
            icon: <Calendar size={24} className="text-gray-500" />,
            details: [
                { label: 'Used', value: leaveBalance.leaveWithoutPay.used.toFixed(1), textColor: 'text-red-600' },
            ],
        },
    ];

    const renderDashboardView = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                </div>
            );
        }

        return (
            <div className="space-y-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Leave Balance Overview</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {leaveBalanceMetrics.map((metric) => (
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
                                    {metric.note && (
                                        <p className="text-sm text-gray-600 mt-2">{metric.note}</p>
                                    )}
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
        const applicationMonth = leaveFormData.startDate ? new Date(leaveFormData.startDate).getMonth() + 1 : null;

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">Apply for Leave</h2>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    {currentMonth <= 6 && leaveBalance.earnedLeave.usedSecondHalf > 0 && (leaveFormData.leaveType === 'EL' || leaveFormData.leaveType === 'HALF_DAY_EL') && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-yellow-800 font-medium">
                                Pending advance EL: {leaveBalance.earnedLeave.usedSecondHalf.toFixed(1)} days.
                            </p>
                        </div>
                    )}
                    {(leaveFormData.leaveType === 'CL' || leaveFormData.leaveType === 'HALF_DAY_CL') && applicationMonth > currentMonth && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-yellow-800 font-medium">
                                Advance CL for {new Date(leaveFormData.startDate).toLocaleString('default', { month: 'long' })}: {(leaveApplications
                                .filter(app => (app.leaveType === 'CL' || app.leaveType === 'HALF_DAY_CL') &&
                                    (app.status === 'APPROVED' || app.status === 'PENDING'))
                                .reduce((total, app) => total + calculateLeaveDays(app.startDate, app.endDate, app.leaveType), 0) + leaveDays).toFixed(1)} days committed.
                            </p>
                        </div>
                    )}
                    {(leaveFormData.leaveType === 'CL' || leaveFormData.leaveType === 'HALF_DAY_CL') && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800 font-medium">
                                Accrued CL: {(userData?.accruedCl || 0).toFixed(1)} days.
                            </p>
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                                <select
                                    value={leaveFormData.leaveType}
                                    onChange={(e) => setLeaveFormData({
                                        ...leaveFormData,
                                        leaveType: e.target.value,
                                        endDate: ''
                                    })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoComplete="off"
                                >
                                    <option value="CL" disabled={!isLeaveTypeAvailable('CL')}>
                                        Casual Leave {isLeaveTypeAvailable('CL') ? '' : '(Unavailable)'}
                                    </option>
                                    <option value="EL" disabled={!isLeaveTypeAvailable('EL')}>
                                        Earned Leave
                                    </option>
                                    <option value="HALF_DAY_CL" disabled={!isLeaveTypeAvailable('HALF_DAY_CL')}>
                                        Half-Day CL
                                    </option>
                                    <option value="HALF_DAY_EL" disabled={!isLeaveTypeAvailable('HALF_DAY_EL')}>
                                        Half-Day EL
                                    </option>
                                    {userData?.gender?.toUpperCase() === 'FEMALE' && (
                                        <option value="ML" disabled={!isLeaveTypeAvailable('ML')}>
                                            Maternity Leave
                                        </option>
                                    )}
                                    {userData?.gender?.toUpperCase() === 'MALE' && (
                                        <option value="PL" disabled={!isLeaveTypeAvailable('PL')}>
                                            Paternity Leave
                                        </option>
                                    )}
                                    <option value="LWP" disabled={!isLeaveTypeAvailable('LWP')}>
                                        Leave Without Pay
                                    </option>
                                    <option value="HALF_DAY_LWP" disabled={!isLeaveTypeAvailable('HALF_DAY_LWP')}>
                                        Half-Day LWP
                                    </option>
                                </select>
                                {leaveBalance[leaveTypeMap[leaveFormData.leaveType]]?.remaining <= 0 && !['EL', 'HALF_DAY_EL', 'CL', 'HALF_DAY_CL'].includes(leaveFormData.leaveType) && (
                                    <div className="text-red-600 text-sm mt-1">
                                        No remaining {leaveFormData.leaveType.replace(/_/g, ' ').toLowerCase()} available.
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
                                        onChange={(e) => {
                                            const startDate = e.target.value;
                                            setLeaveFormData({ ...leaveFormData, startDate });
                                            if (isNonWorkingDay(startDate) && (leaveFormData.leaveType === 'HALF_DAY_CL' || leaveFormData.leaveType === 'HALF_DAY_EL' || leaveFormData.leaveType === 'HALF_DAY_LWP')) {
                                                setError('Half-day leave cannot be applied on a non-working day');
                                            } else {
                                                setError('');
                                            }
                                        }}
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
                                            onChange={(e) => setLeaveFormData({
                                                ...leaveFormData,
                                                endDate: e.target.value
                                            })}
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
                                        {leaveFormData.leaveType === 'ML' ? 'Maternity leave: 182 days.' : 'Paternity leave: 15 days.'}
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
                                    placeholder="Provide a reason for your leave"
                                ></textarea>
                            </div>
                        </div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Total leave days: <span className="font-bold">{leaveDays.toFixed(1)}</span>
                            </p>
                        </div>
                        <button
                            onClick={handleLeaveSubmit}
                            disabled={
                                isSubmitting ||
                                !leaveFormData.startDate ||
                                !leaveFormData.reason ||
                                ((leaveFormData.leaveType !== 'HALF_DAY_CL' &&
                                        leaveFormData.leaveType !== 'HALF_DAY_EL' &&
                                        leaveFormData.leaveType !== 'HALF_DAY_LWP' &&
                                        leaveFormData.leaveType !== 'ML' &&
                                        leaveFormData.leaveType !== 'PL') &&
                                    !leaveFormData.endDate) ||
                                (leaveFormData.startDate && leaveFormData.startDate < today) ||
                                (leaveFormData.endDate && leaveFormData.startDate && leaveFormData.endDate < leaveFormData.startDate && leaveFormData.leaveType !== 'ML' && leaveFormData.leaveType !== 'PL') ||
                                leaveDays === 0
                            }
                            className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                isSubmitting ||
                                !leaveFormData.startDate ||
                                !leaveFormData.reason ||
                                leaveDays === 0
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-700 hover:bg-blue-800'
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
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                </div>
            );
        }

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
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                                </tr>
                                </thead>
                                <tbody>
                                {leaveApplications.map((application) => (
                                    <tr key={application.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">{application.leaveType || 'N/A'}</td>
                                        <td className="py-3 px-4">{formatDate(application.startDate)}</td>
                                        <td className="py-3 px-4">
                                            {(application.leaveType === 'HALF_DAY_CL' ||
                                                application.leaveType === 'HALF_DAY_EL' ||
                                                application.leaveType === 'HALF_DAY_LWP')
                                                ? `${formatDate(application.startDate)} (Half-Day)`
                                                : application.endDate ? formatDate(application.endDate) : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                                                {getStatusIcon(application.status)}
                                                <span className="ml-1">{application.status || 'Unknown'}</span>
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">{formatDate(application.appliedOn)}</td>
                                        <td className="py-3 px-4">{(application.remainingLeaves != null ? application.remainingLeaves : 0).toFixed(1)}</td>
                                        <td className="py-3 px-4">{application.reason || 'N/A'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-600">No leave applications found.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderSubordinatesView = () => {
        if (subordinates.length === 0) return null;
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">Subordinates</h2>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    {subordinates.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                                </tr>
                                </thead>
                                <tbody>
                                {subordinates.map((subordinate) => (
                                    <tr key={subordinate.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">{subordinate.fullName || 'N/A'}</td>
                                        <td className="py-3 px-4">{subordinate.role || 'N/A'}</td>
                                        <td className="py-3 px-4">{subordinate.email || 'N/A'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-600">No subordinates found.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderPendingLeavesView = () => {
        if (subordinates.length === 0) return null;
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900">Pending Leave Approvals</h2>
                <div className="bg-white rounded-lg shadow-lg p-6">
                    {pendingLeaves.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Employee</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Start Date</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">End Date</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pendingLeaves.map((leave) => (
                                    <tr key={leave.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">{leave.employee?.fullName || 'N/A'}</td>
                                        <td className="py-3 px-4">{leave.leaveType || 'N/A'}</td>
                                        <td className="py-3 px-4">{formatDate(leave.startDate)}</td>
                                        <td className="py-3 px-4">
                                            {(leave.leaveType === 'HALF_DAY_CL' ||
                                                leave.leaveType === 'HALF_DAY_EL' ||
                                                leave.leaveType === 'HALF_DAY_LWP')
                                                ? `${formatDate(leave.startDate)} (Half-Day)`
                                                : leave.endDate ? formatDate(leave.endDate) : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4">{leave.reason || 'N/A'}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleLeaveAction(leave.id, 'approve')}
                                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                                    disabled={isSubmitting}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Reason for rejection:');
                                                        if (reason) handleLeaveAction(leave.id, 'reject', reason);
                                                    }}
                                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                                    disabled={isSubmitting}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-600">No pending leave requests.</p>
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
            case 'dashboard': return renderDashboardView();
            case 'apply-leave': return renderApplyLeaveView();
            case 'leave-applications': return renderLeaveApplicationsView();
            case 'subordinates': return renderSubordinatesView();
            case 'pending-leaves': return renderPendingLeavesView();
            default: return renderDashboardView();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            <div
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-blue-900 text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out shadow-lg`}
            >
                <div className="flex items-center justify-between p-4 border-b border-blue-800">
                    <div className="flex items-center space-x-3">
                        <img src="/Images/bisag_logo.png" alt="BISAG-N Logo" className="h-10 w-10 rounded-full" />
                        <span className="text-xl font-semibold">BISAG-N HRMS</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
                        <X size="24" />
                    </button>
                </div>
                <nav className="p-4 space-y-2">
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${activeView === 'dashboard' ? 'bg-blue-800' : 'hover:bg-blue-800'}`}
                    >
                        <User size={20} className="mr-3" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveView('apply-leave')}
                        className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${activeView === 'apply-leave' ? 'bg-blue-800' : 'hover:bg-blue-800'}`}
                    >
                        <FileText size={20} className="mr-3" />
                        Apply for Leave
                    </button>
                    <button
                        onClick={() => setActiveView('leave-applications')}
                        className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${activeView === 'leave-applications' ? 'bg-blue-800' : 'hover:bg-blue-800'}`}
                    >
                        <CalendarCheck size={20} className="mr-3" />
                        Leave Applications
                    </button>
                    {subordinates.length > 0 && (
                        <>
                            <button
                                onClick={() => setActiveView('subordinates')}
                                className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${activeView === 'subordinates' ? 'bg-blue-800' : 'hover:bg-blue-800'}`}
                            >
                                <Users size={20} className="mr-3" />
                                Subordinates
                            </button>
                            <button
                                onClick={() => setActiveView('pending-leaves')}
                                className={`flex items-center w-full p-3 text-left rounded-lg transition duration-200 ${activeView === 'pending-leaves' ? 'bg-blue-800' : 'hover:bg-blue-800'}`}
                            >
                                <Clock size={20} className="mr-3" />
                                Pending Leaves
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full p-3 text-left rounded-lg hover:bg-red-600 transition duration-200"
                    >
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
                        <h1 className="text-2xl font-semibold text-gray-900">BISAG-N Dashboard</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                            <span className="text-gray-700 font-medium">Welcome, {userData?.fullName || 'User'}</span>
                            {userData?.reportingTo?.fullName ? (
                                <span className="text-gray-500 text-sm">
        Reporting to: {userData.reportingTo.fullName}
      </span>
                            ) : (
                                <span className="text-gray-500 text-sm">Reporting to: Not assigned</span>
                            )}
                        </div>
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
                    <div className="space-y-8">{renderMainContent()}</div>
                </main>

                <footer className="bg-blue-900 text-white py-4 text-center">
                    <p className="text-sm">© 2025 BISAG-N. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}