import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Check, Github, Users, ChevronDown, GraduationCap } from 'lucide-react';
import api from '../api/axios';
import Toast from '../components/Toast';

import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Check for existing session or OAuth success
    React.useEffect(() => {
        const token = localStorage.getItem('token');
        const urlParams = new URLSearchParams(window.location.search);
        const loginSuccess = urlParams.get('login_success');

        if (token) {
            if (loginSuccess) {
                showToast('Login successful! Redirecting...', 'success');
            }


            // Redirect to dashboard after delay
            const timer = setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [navigate]);

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'Student',
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                // Super Admin Check
                if (formData.email === 'superadmin@gmail.com' && formData.password === 'superadmin@123') {
                    showToast('Welcome, Super Admin!', 'success');

                    // Clear any existing local storage to prevent auto-login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');

                    // Store mock admin session in sessionStorage (ephemeral)
                    sessionStorage.setItem('user', JSON.stringify({
                        fullName: 'Super Admin',
                        email: 'superadmin@gmail.com',
                        role: 'Admin'
                    }));
                    sessionStorage.setItem('token', 'mock-super-admin-token');

                    setTimeout(() => {
                        navigate('/super-admin-dashboard');
                    }, 1500);
                    return;
                }

                // Normal Login
                const response = await api.post('/auth/login', {
                    email: formData.email,
                    password: formData.password,
                });

                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                showToast(`Welcome back, ${response.data.user.fullName}!`, 'success');

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);

            } else {
                // Signup
                const response = await api.post('/auth/signup', {
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                });

                // localStorage.setItem('token', response.data.token);
                // localStorage.setItem('user', JSON.stringify(response.data.user));

                showToast('Account created successfully! Please login.', 'success');

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    setIsLogin(true);
                }, 2000);
            }

            // Clear form
            setFormData({ fullName: '', email: '', password: '' });

        } catch (error) {
            console.error('Auth error:', error);
            const errorMessage = error.response?.data?.error || 'Something went wrong. Please try again.';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full">
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Left Side - Hero Section */}
            <div className="hidden lg:flex w-1/2 bg-[#3B6088] relative flex-col justify-between p-12 text-white overflow-hidden">
                {/* Grid Background Pattern */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}>
                </div>

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-2 text-2xl font-bold">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#3B6088]" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    AcademIQ
                </div>

                {/* Hero Image & Content */}
                <div className="relative z-10 flex flex-col items-center text-center mt-10">
                    <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-8 border border-white/20 shadow-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            alt="Students collaborating"
                            className="w-full h-64 object-cover rounded-xl"
                        />
                    </div>

                    <h1 className="text-4xl font-bold mb-4">Unlock Your Potential</h1>
                    <p className="text-blue-100 text-lg max-w-md">
                        Engage with a vibrant community of learners and educators, with access to advanced courses, interactive quizzes, and personalized learning journeys.
                    </p>
                </div>

                {/* Footer Quote */}
                <div className="relative z-10 text-sm text-blue-200">
                    "Education is the passport to the future." — Malcolm X
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-gray-500">
                            {isLogin ? 'Please enter your details to sign in.' : 'Start your learning journey today.'}
                        </p>
                    </div>

                    {/* Toggle Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${!isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="First + Last name"
                                        required={!isLogin}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 relative overflow-hidden group">
                                    {/* Slider Background */}
                                    <div
                                        className="absolute inset-y-1.5 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-[#3B6088] rounded-[14px] shadow-lg shadow-blue-900/20"
                                        style={{
                                            width: 'calc(50% - 6px)',
                                            left: formData.role === 'Student' ? '6px' : 'calc(50%)'
                                        }}
                                    ></div>

                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, role: 'Student' }))}
                                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 relative z-10 text-sm font-bold transition-colors duration-300 ${formData.role === 'Student' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <GraduationCap size={18} strokeWidth={2.5} />
                                        <span>Student</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, role: 'Instructor' }))}
                                        className={`flex-1 flex items-center justify-center gap-2.5 py-3 relative z-10 text-sm font-bold transition-colors duration-300 ${formData.role === 'Instructor' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Users size={18} strokeWidth={2.5} />
                                        <span>Instructor</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Provide a valid email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="••••••"
                                    required
                                    className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-[#4A729D] hover:bg-[#3B6088] text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                            className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span className="font-medium text-gray-700">Google</span>
                        </button>
                        <button
                            onClick={() => window.location.href = 'http://localhost:5000/api/auth/github'}
                            className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <Github className="w-5 h-5 text-gray-800" />
                            <span className="font-medium text-gray-700">GitHub</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
