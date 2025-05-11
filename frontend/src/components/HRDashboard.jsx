import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HRDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'HR') {
      navigate('/');
      return;
    }

    setUserData({ fullName: 'Test HR User' });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-700 text-white py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center">
          <div className="flex items-center space-x-2">
            <img 
              src='/Images/bisag_logo.png' 
              alt="BISAG-N Logo" 
              className="h-20 w-30 rounded-full"
            />
            <h1 className="text-xl font-bold">BISAG-N HR Management System</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">HR Dashboard</h2>
          {userData && (
            <p className="text-gray-600">
              Welcome, {userData.fullName}! Manage employees, view reports, and more.
            </p>
          )}
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              navigate('/');
            }}
            className="mt-4 bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-800"
          >
            Logout
          </button>
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