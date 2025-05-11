import { useState } from 'react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      const response = await fetch('http://localhost:8082/api/auth/forgot-password', {
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
            <h2 className="text-xl font-bold text-white">Forgot Password</h2>
            <p className="text-blue-100 text-sm">We'll help you recover your account</p>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {!submitted ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-700">
                    Enter your email address associated with your account. We'll send a password reset link to this email.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200`}
                    >
                      {isLoading ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send size={16} className="mr-2" />
                          Send Reset Link
                        </>
                      )}
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