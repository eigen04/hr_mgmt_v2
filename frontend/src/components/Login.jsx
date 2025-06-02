import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, AlertCircle, CheckCircle, Eye, EyeOff, Sparkles, Shield, ArrowRight } from 'lucide-react';

export default function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const savedUsername = localStorage.getItem('rememberedUsername');
        if (savedUsername) {
            setFormData((prev) => ({ ...prev, username: savedUsername }));
            setRememberMe(true);
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccessMessage('');
    };

    const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!formData.username || !formData.password) {
            setError('Username and password are required');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8081/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            console.log('Login response:', data); // Debug log to verify response

            if (response.ok) {
                // Store auth data in localStorage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('role', data.role);

                if (rememberMe) {
                    localStorage.setItem('rememberedUsername', formData.username);
                } else {
                    localStorage.removeItem('rememberedUsername');
                }

                setSuccessMessage('Login successful!');
                setTimeout(() => {
                    if (!data.role) {
                        setError('No role provided by server');
                        return;
                    }
                    console.log('Navigating with role:', data.role); // Debug log before navigation
                    switch (data.role.toUpperCase()) {
                        case 'HR':
                            navigate('/hr-dashboard', { replace: true });
                            break;
                        case 'PROJECT_MANAGER':
                            navigate('/hod-dashboard', { replace: true });
                            break;
                        case 'ASSISTANT_DIRECTOR':
                            navigate('/assistantdirector-dashboard', { replace: true });
                            break;
                        case 'DIRECTOR':
                            navigate('/director-dashboard', { replace: true });
                            break;
                        case 'EMPLOYEE':
                            navigate('/employee-dashboard', { replace: true });
                            break;
                        default:
                            setError('Unknown role');
                    }
                }, 500);
            } else {
                setError(data.message || 'Invalid username or password');
            }
        } catch (err) {
            console.error('Login error:', err); // Debug log for errors
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
                    {/* Login Card */}
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
                                        <h2 className="text-2xl font-bold text-white">Welcome</h2>
                                    </div>
                                    <p className="text-blue-100 font-medium">Sign in to access your dashboard</p>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-8">
                                {/* Status Messages */}
                                {error && (
                                    <div className="mb-6 relative">
                                        <div className="absolute inset-0 bg-red-500/10 rounded-xl blur-sm"></div>
                                        <div className="relative flex items-center p-4 bg-red-50/80 backdrop-blur-sm text-red-700 rounded-xl border border-red-200/50">
                                            <AlertCircle size={20} className="flex-shrink-0 mr-3 text-red-500" />
                                            <p className="text-sm font-medium">{error}</p>
                                        </div>
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="mb-6 relative">
                                        <div className="absolute inset-0 bg-green-500/10 rounded-xl blur-sm"></div>
                                        <div className="relative flex items-center p-4 bg-green-50/80 backdrop-blur-sm text-green-700 rounded-xl border border-green-200/50">
                                            <CheckCircle size={20} className="flex-shrink-0 mr-3 text-green-500" />
                                            <p className="text-sm font-medium">{successMessage}</p>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleLogin} className="space-y-6">
                                    {/* Username Field */}
                                    <div className="space-y-2">
                                        <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                                            Username
                                        </label>
                                        <div className="relative group">
                                            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${focusedField === 'username' ? 'opacity-30' : ''}`}></div>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <User size={20} className={`transition-colors duration-300 ${focusedField === 'username' ? 'text-blue-500' : 'text-gray-400'}`} />
                                                </div>
                                                <input
                                                    id="username"
                                                    type="text"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleChange}
                                                    onFocus={() => setFocusedField('username')}
                                                    onBlur={() => setFocusedField('')}
                                                    className="pl-12 pr-4 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                                                    placeholder="Enter your username"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password Field */}
                                    <div className="space-y-2">
                                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                            Password
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
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    onFocus={() => setFocusedField('password')}
                                                    onBlur={() => setFocusedField('')}
                                                    className="pl-12 pr-12 block w-full h-12 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-300"
                                                    placeholder="Enter your password"
                                                    required
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
                                    </div>

                                    {/* Remember Me & Forgot Password */}
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={rememberMe}
                                                    onChange={(e) => setRememberMe(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-5 h-5 rounded border-2 transition-all duration-300 ${rememberMe ? 'bg-blue-500 border-blue-500' : 'border-gray-300 group-hover:border-blue-400'}`}>
                                                    {rememberMe && <CheckCircle size={16} className="text-white absolute inset-0" />}
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300">
                                                Remember me
                                            </span>
                                        </label>
                                        <Link
                                            to="/forgot-username"
                                            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-300 hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>

                                    {/* Login Button */}
                                    <button
                                        type="submit"
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
                                                    <span>Signing in...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Sign In</span>
                                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </form>

                                {/* Create Account Link */}
                                <div className="mt-8 text-center">
                                    <p className="text-gray-600">
                                        Don't have an account?{' '}
                                        <Link
                                            to="/signup"
                                            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-300 hover:underline"
                                        >
                                            Create account
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-8 text-center">
                        <p className="text-blue-200/80 text-sm">
                            Secure login powered by advanced encryption
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