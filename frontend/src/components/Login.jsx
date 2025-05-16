import { useState, useEffect } from 'react';
import { User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

            if (response.ok) {
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
                    switch (data.role.toUpperCase()) {
                        case 'HR':
                            navigate('/hr-dashboard', { replace: true });
                            break;
                        case 'HOD':
                            navigate('/hod-dashboard', { replace: true });
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
        } catch {
            setError('An error occurred. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-blue-700 text-white py-4 px-6 shadow-md">
                <div className="max-w-7xl mx-auto flex items-center">
                    <img
                        src="/Images/bisag_logo.png"
                        alt="BISAG-N Logo"
                        className="h-20 w-30 rounded-full"
                    />
                    <h1 className="ml-3 text-xl font-bold">BISAG-N HR Management System</h1>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-6">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="bg-blue-700 px-6 py-4">
                        <h2 className="text-xl font-bold text-white">Welcome Back</h2>
                        <p className="text-blue-100 text-sm">Sign in to your account</p>
                    </div>

                    <div className="p-6">
                        {error && (
                            <div className="mb-4 flex items-center p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                                <AlertCircle size={20} className="flex-shrink-0 mr-2" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        {successMessage && (
                            <div className="mb-4 flex items-center p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
                                <CheckCircle size={20} className="flex-shrink-0 mr-2" />
                                <p className="text-sm">{successMessage}</p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        id="username"
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your username"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type={passwordVisible ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                                        aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                                    >
                                        {passwordVisible ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
                                        Remember me
                                    </label>
                                </div>
                                <Link to="/forgot-username" className="text-sm text-blue-600 hover:text-blue-500">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-2.5 px-4 rounded-md text-sm font-medium text-white ${
                                    isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                            >
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-blue-600 hover:text-blue-500">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            <footer className="bg-blue-700 text-white py-4 text-center">
                <div className="max-w-7xl mx-auto px-4">
                    <p className="text-sm">© 2025 BISAG-N. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}