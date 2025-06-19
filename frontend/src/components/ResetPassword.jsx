import { useState, useEffect } from 'react';
import { Lock, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) setToken(tokenFromUrl);
    else setError('Invalid or missing reset token');
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
      const response = await fetch('http://localhost:8081/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
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

  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);
  const toggleConfirmPasswordVisibility = () => setConfirmPasswordVisible(!confirmPasswordVisible);

  return (
      <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
        {/* Subtle Orbital Background */}
        <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 50 A 40 40 0 0 1 90 50' fill='none' stroke='%23D32F2F' stroke-width='0.5' opacity='0.3'/%3E%3Ccircle cx='50' cy='50' r='4' fill='%230055A4' opacity='0.4'/%3E%3Ccircle cx='90' cy='50' r='2' fill='%23D32F2F' opacity='0.4'/%3E%3Cpath d='M15 50 A 35 35 0 0 0 85 50' fill='none' stroke='%230055A4' stroke-width='0.3' opacity='0.2'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
              backgroundRepeat: 'repeat',
            }}
        ></div>

        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-800">BISAG-N</h1>
                <p className="text-sm text-gray-600">HR Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Shield className="w-4 h-4 text-blue-700" />
              <span className="text-sm font-medium">Secure Access Portal</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md z-10">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-semibold text-blue-800">Reset Password</h2>
                <p className="text-sm text-gray-600 mt-1">Enter your new password</p>
              </div>

              {!success ? (
                  <>
                    {error && (
                        <div className="mb-6 flex items-center p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                          <AlertCircle size={20} className="flex-shrink-0 mr-3 text-red-600" />
                          <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                      {/* Password Field */}
                      <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={20} className={`text-gray-400 ${focusedField === 'password' ? 'text-blue-700' : ''}`} />
                          </div>
                          <input
                              id="password"
                              type={passwordVisible ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onFocus={() => setFocusedField('password')}
                              onBlur={() => setFocusedField('')}
                              className="pl-10 pr-10 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-all duration-200"
                              placeholder="Enter new password"
                          />
                          <button
                              type="button"
                              onClick={togglePasswordVisibility}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-700 transition-colors duration-200"
                          >
                            {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                      </div>

                      {/* Confirm Password Field */}
                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={20} className={`text-gray-400 ${focusedField === 'confirmPassword' ? 'text-blue-700' : ''}`} />
                          </div>
                          <input
                              id="confirmPassword"
                              type={confirmPasswordVisible ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              onFocus={() => setFocusedField('confirmPassword')}
                              onBlur={() => setFocusedField('')}
                              className="pl-10 pr-10 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-all duration-200"
                              placeholder="Confirm new password"
                          />
                          <button
                              type="button"
                              onClick={toggleConfirmPasswordVisibility}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-700 transition-colors duration-200"
                          >
                            {confirmPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                          onClick={handleSubmit}
                          disabled={isLoading || !token}
                          className={`w-full h-10 rounded-md font-medium text-white transition-all duration-200 ${isLoading || !token ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2'}`}
                      >
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                              <span>Resetting...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <span>Reset Password</span>
                              <ArrowRight size={18} />
                            </div>
                        )}
                      </button>
                    </div>
                  </>
              ) : (
                  <div className="text-center py-6">
                    <div className="mb-4 flex justify-center">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Password Reset Successfully</h3>
                    <p className="text-gray-600 mb-6">Your password has been updated. You can now log in with your new password.</p>
                  </div>
              )}

              {/* Back to Login Link */}
              <div className="mt-6 text-center">
                <Link to="/" className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors duration-200">Back to Login</Link>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">Secure password reset powered by BISAG-N</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-blue-700" />
              <p className="text-sm text-gray-600">© 2025 BISAG-N. All rights reserved.</p>
            </div>
            <p className="text-xs text-gray-500">Bhaskaracharya National Institute for Space Applications and Geo-informatics</p>
          </div>
        </footer>
      </div>
  );
}