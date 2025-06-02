import { useState } from 'react';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(''); // For input focus effects

  const handleSubmit = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8081/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setEmail('');
      } else {
        setError(responseData.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
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
          {/* Forgot Password Card */}
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
                    <h2 className="text-2xl font-bold text-white">Forgot Password</h2>
                  </div>
                  <p className="text-blue-100 font-medium">We'll help you recover your account</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-8">
                {!submitted ? (
                  <>
                    <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4 mb-6">
                      <p className="text-sm text-blue-700">
                        Enter your email address associated with your account. We'll send a password reset link to this email.
                      </p>
                    </div>

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
                      {/* Email Field */}
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
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onFocus={() => setFocusedField('email')}
                              onBlur={() => setFocusedField('')}
                              className="pl-12 pr-4 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                              placeholder="your.email@example.com"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={`relative w-full h-12 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                          isLoading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 shadow-blue-500/25 hover:shadow-blue-500/40'
                        }`}
                      >
                        <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center justify-center space-x-2">
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send size={18} className="mr-2" />
                              <span>Send Reset Link</span>
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Email Sent Successfully</h3>
                    <p className="text-gray-600 mb-6">
                      We've sent a password reset link to <strong>{email}</strong>.
                      Please check your inbox and spam folder.
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
              Secure password recovery powered by advanced encryption
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