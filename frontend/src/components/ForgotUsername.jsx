import { useState } from 'react';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');

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
        headers: { 'Content-Type': 'application/json' },
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
                <h2 className="text-2xl font-semibold text-blue-800">Forgot Password</h2>
                <p className="text-sm text-gray-600 mt-1">We'll help you recover your account</p>
              </div>

              {!submitted ? (
                  <>
                    <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                      <p className="text-sm">Enter your email address associated with your account. We'll send a password reset link to this email.</p>
                    </div>

                    {error && (
                        <div className="mb-6 flex items-center p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                          <AlertCircle size={20} className="flex-shrink-0 mr-3 text-red-600" />
                          <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                      {/* Email Field */}
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail size={20} className={`text-gray-400 ${focusedField === 'email' ? 'text-blue-700' : ''}`} />
                          </div>
                          <input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onFocus={() => setFocusedField('email')}
                              onBlur={() => setFocusedField('')}
                              className="pl-10 block w-full h-10 rounded-md border border-gray-300 bg-gray-50 text-gray-900 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 transition-all duration-200"
                              placeholder="your.email@example.com"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className={`w-full h-10 rounded-md font-medium text-white transition-all duration-200 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2'}`}
                      >
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                              <span>Sending...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <Send size={18} className="mr-2" />
                              <span>Send Reset Link</span>
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Email Sent Successfully</h3>
                    <p className="text-gray-600 mb-6">We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.</p>
                  </div>
              )}

              {/* Back to Login Link */}
              <div className="mt-6 text-center">
                <Link to="/" className="text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors duration-200">Back to Login</Link>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">Secure password recovery powered by BISAG-N</p>
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