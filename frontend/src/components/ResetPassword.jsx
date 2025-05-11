import { useState, useEffect } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Invalid or missing reset token');
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8082/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setSuccess(true);
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(responseData.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
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

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Page Header */}
          <div className="bg-blue-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Reset Password</h2>
            <p className="text-blue-100 text-sm">Enter your new password</p>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {!success ? (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter new password"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading || !token}
                      className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        isLoading || !token ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200`}
                    >
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="mb-4 flex justify-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Password Reset Successfully</h3>
                <p className="text-gray-600 mb-6">
                  Your password has been updated. You can now log in with your new password.
                </p>
              </div>
            )}

            {/* Back to Login Link */}
            <div className="mt-6 text-center">
              <Link 
                to="/" 
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Login
              </Link>
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