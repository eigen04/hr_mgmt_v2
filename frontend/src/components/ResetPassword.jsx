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
  const [focusedField, setFocusedField] = useState(''); // For input focus effects

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
      const response = await fetch('http://localhost:8081/api/auth/reset-password', {
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
          {/* Reset Password Card */}
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
                    <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                  </div>
                  <p className="text-blue-100 font-medium">Enter your new password</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-8">
                {!success ? (
                  <>
                    {error && (
                      <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-red-500/10 rounded-xl blur-sm"></div>
                        <div className="relative flex items-center p-4 bg-red-50/80 backdrop-blur-sm text-red-700 rounded-xl border border-red-200/50">
                          <AlertCircle size={20} className="flex-shrink-0 mr-3 text-red-500" />
                          <p className="text-sm font-medium">{error}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      {/* Password Field */}
                      <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                          New Password
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
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onFocus={() => setFocusedField('password')}
                              onBlur={() => setFocusedField('')}
                              className="pl-12 pr-12 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                              placeholder="Enter new password"
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

                      {/* Confirm Password Field */}
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
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              onFocus={() => setFocusedField('confirmPassword')}
                              onBlur={() => setFocusedField('')}
                              className="pl-12 pr-12 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                              placeholder="Confirm new password"
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
                        onClick={handleSubmit}
                        disabled={isLoading || !token}
                        className={`relative w-full h-12 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                          isLoading || !token
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 shadow-blue-500/25 hover:shadow-blue-500/40'
                        }`}
                      >
                        <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center justify-center space-x-2">
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Resetting...</span>
                            </>
                          ) : (
                            <>
                              <span>Reset Password</span>
                              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="mb-4 flex justify-center">
                      <CheckCircle size={32} className="text-green-500" />
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
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300 hover:underline"
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-blue-200/80 text-sm">
              Secure password reset powered by advanced encryption
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