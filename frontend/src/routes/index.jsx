import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ForgotUsernamePage from '../pages/ForgotUsernamePage';
import HRDashboardPage from '../pages/HRDashboardPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import EmployeeDashboardPage from '../pages/EmployeeDashboardPage';
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage/>}/>
      <Route path="/employee-dashboard" element={<EmployeeDashboardPage/>}/>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-username" element={<ForgotUsernamePage />} />
      <Route path="/hr-dashboard" element={<HRDashboardPage />} />
    </Routes>
  );
};

export default AppRoutes;