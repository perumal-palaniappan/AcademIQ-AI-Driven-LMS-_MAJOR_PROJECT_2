import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Zap,
    HelpCircle,
    Settings as SettingsIcon,
    User,
    Shield,
    Moon,
    Info,
    AlertTriangle,
    Camera,
    ChevronRight,
    LogOut,
    Check,
    Smartphone,
    Mail,
    MoreHorizontal
} from 'lucide-react';

const Settings = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        fullName: 'Guest User',
        email: '',
        role: 'Student',
        avatar: null,
        isSocialLogin: false
    });
    const [showSidebarProfileMenu, setShowSidebarProfileMenu] = useState(false);
    const sidebarProfileRef = useRef(null);

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteAccount = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('You are not logged in', 'error');
                navigate('/');
                return;
            }

            const response = await axios.delete('http://localhost:5000/api/auth/delete-account', {
                headers: { Authorization: `Bearer ${token}` }
            });

            showToast(response.data.message, 'success');

            // Clear local storage and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            setTimeout(() => {
                navigate('/');
            }, 1000);

        } catch (error) {
            console.error('Error deleting account:', error);
            showToast(error.response?.data?.error || 'Failed to delete account', 'error');
            setShowDeleteModal(false);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdatePassword = async () => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            showToast('Please fill in all password fields', 'error');
            return;
        }

        if (passwords.new !== passwords.confirm) {
            showToast('New passwords do not match', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('You are not logged in', 'error');
                navigate('/');
                return;
            }

            const response = await axios.put('http://localhost:5000/api/auth/change-password', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showToast(response.data.message, 'success');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error) {
            console.error('Error updating password:', error);
            showToast(error.response?.data?.error || 'Failed to update password', 'error');
        }
    };

    // Parse first name and last name from full name
    const getFirstName = (fullName) => {
        if (!fullName) return '';
        const parts = fullName.trim().split(' ');
        return parts[0] || '';
    };

    const getLastName = (fullName) => {
        if (!fullName) return '';
        const parts = fullName.trim().split(' ');
        return parts.length > 1 ? parts.slice(1).join(' ') : '';
    };

    // State for active section in quick navigation
    const [activeSection, setActiveSection] = useState('profile');

    // Refs for scrolling to sections
    const profileRef = useRef(null);
    const securityRef = useRef(null);
    const appearanceRef = useRef(null);
    const aboutRef = useRef(null);
    const dangerRef = useRef(null);

    // Scroll to section function
    const scrollToSection = (sectionName, ref) => {
        setActiveSection(sectionName);
        if (ref && ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Load user from local storage if available
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(prev => ({ ...prev, ...parsedUser }));
            } catch (e) {
                console.error('Failed to parse user data');
            }
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarProfileRef.current && !sidebarProfileRef.current.contains(event.target)) {
                setShowSidebarProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const activePage = 'Settings';

    return (
        <div className="flex min-h-screen bg-[#FDFBF7] font-sans">
            {/* Sidebar - Same as Dashboard */}
            <aside className="w-64 bg-[#2C4B64] text-white flex flex-col fixed h-full transition-all duration-300 z-20">
                <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AcademIQ</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => navigate('/dashboard')} />
                    <SidebarItem icon={<BookOpen size={20} />} label="Courses" onClick={() => navigate('/courses')} />
                    {user.role?.toLowerCase() === 'student' && (
                        <SidebarItem
                            icon={<FileText size={20} />}
                            label="AI Notes"
                            active={activePage === 'AI Notes'}
                            onClick={() => navigate('/ai-notes')}
                        />
                    )}
                    <SidebarItem icon={<Zap size={20} />} label="Flashcards" />
                    <SidebarItem icon={<HelpCircle size={20} />} label="Quiz" active={activePage === 'Quiz'} onClick={() => navigate('/quizzes')} />
                </nav>

                <div className="p-4 mt-auto border-t border-white/5">
                    <SidebarItem icon={<SettingsIcon size={20} />} label="Settings" active />

                    <div className="relative mt-4" ref={sidebarProfileRef}>
                        <button
                            onClick={() => setShowSidebarProfileMenu(!showSidebarProfileMenu)}
                            className={`w-full group flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 border ${showSidebarProfileMenu
                                ? 'bg-white/15 border-white/20 shadow-lg shadow-black/20'
                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                }`}
                        >
                            <div className="relative">
                                <UserAvatar user={user} size="sm" />
                            </div>
                            <div className="flex-1 text-left overflow-hidden">
                                <p className="font-bold text-sm text-white truncate">
                                    {user.fullName}
                                </p>
                                <p className="text-[10px] font-medium text-blue-300/50 tracking-widest truncate">
                                    {user.role || 'Student'}
                                </p>
                            </div>
                            <MoreHorizontal
                                size={18}
                                className={`text-gray-400 transition-all duration-300 ${showSidebarProfileMenu ? 'rotate-90 text-white' : 'group-hover:text-white'
                                    }`}
                            />
                        </button>

                        {showSidebarProfileMenu && (
                            <div className="absolute bottom-full left-0 w-full mb-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="p-1.5">
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setShowSidebarProfileMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all group text-left"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                            <LogOut size={16} className="text-gray-500 group-hover:text-red-500" />
                                        </div>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 lg:p-12">
                {/* Header */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-[#2C4B64]">Account Settings</h1>
                        <p className="text-gray-500 mt-1">Manage your profile, security preferences, and application settings.</p>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-8">
                    {/* Left Column - Navigation & Profile Card */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-[#fff] rounded-2xl p-8 flex flex-col items-center text-center border border-[#E5E0D8]">
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-full p-1 bg-white shadow-sm">
                                    <UserAvatar user={user} size="xl" />
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">{user.fullName}</h2>
                            <p className="text-gray-500 text-sm">{user.role || 'Student'}</p>
                        </div>

                        {/* Quick Navigation */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-50">
                                <h3 className="font-bold text-gray-700 text-sm">Quick Navigation</h3>
                            </div>
                            <nav className="p-2">
                                <NavButton
                                    icon={<User size={18} />}
                                    label="Profile Details"
                                    active={activeSection === 'profile'}
                                    onClick={() => scrollToSection('profile', profileRef)}
                                />
                                <NavButton
                                    icon={<Shield size={18} />}
                                    label="Security"
                                    active={activeSection === 'security'}
                                    onClick={() => scrollToSection('security', securityRef)}
                                />
                                <NavButton
                                    icon={<Smartphone size={18} />}
                                    label="Appearance"
                                    active={activeSection === 'appearance'}
                                    onClick={() => scrollToSection('appearance', appearanceRef)}
                                />
                                <NavButton
                                    icon={<Info size={18} />}
                                    label="About"
                                    active={activeSection === 'about'}
                                    onClick={() => scrollToSection('about', aboutRef)}
                                />
                                <div className="my-2 border-t border-gray-50"></div>
                                <button
                                    onClick={() => scrollToSection('danger', dangerRef)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <AlertTriangle size={18} />
                                    Danger Zone
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Right Column - Forms */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">
                        {/* Profile Information */}
                        <section ref={profileRef} className="bg-[#fff] rounded-2xl p-8 border border-[#E5E0D8] scroll-mt-8">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-[#2C4B64]">Profile Information</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">First Name</label>
                                    <input
                                        type="text"
                                        value={getFirstName(user.fullName)}
                                        readOnly
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B6088]/20 focus:border-[#3B6088] transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Name</label>
                                    <input
                                        type="text"
                                        value={getLastName(user.fullName)}
                                        readOnly
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B6088]/20 focus:border-[#3B6088] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="text-gray-400" size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        value={user.email}
                                        readOnly
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B6088]/20 focus:border-[#3B6088] transition-all"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Security & Password */}
                        <section ref={securityRef} className="bg-[#fff] rounded-2xl p-8 border border-[#E5E0D8] scroll-mt-8">
                            <h3 className="text-lg font-bold text-[#2C4B64] mb-6">Security & Password</h3>

                            <div className="space-y-6">
                                {user.isSocialLogin && (
                                    <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm border border-blue-100 flex items-center gap-2">
                                        <Info size={16} />
                                        <span>Password change is disabled because you logged in via Google or GitHub.</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Password</label>
                                    <input
                                        type="password"
                                        name="current"
                                        value={passwords.current}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter your current password"
                                        disabled={user.isSocialLogin}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B6088]/20 focus:border-[#3B6088] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Password</label>
                                        <input
                                            type="password"
                                            name="new"
                                            value={passwords.new}
                                            onChange={handlePasswordChange}
                                            placeholder="Enter new password"
                                            disabled={user.isSocialLogin}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B6088]/20 focus:border-[#3B6088] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirm New Password</label>
                                        <input
                                            type="password"
                                            name="confirm"
                                            value={passwords.confirm}
                                            onChange={handlePasswordChange}
                                            placeholder="Confirm new password"
                                            disabled={user.isSocialLogin}
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3B6088]/20 focus:border-[#3B6088] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        onClick={handleUpdatePassword}
                                        disabled={user.isSocialLogin}
                                        className="px-4 py-2 bg-[#3B6088] text-white rounded-lg text-sm font-medium hover:bg-[#2C4B64] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Theme Preferences */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section ref={appearanceRef} className="bg-[#fff] rounded-2xl p-8 border border-[#E5E0D8] scroll-mt-8">
                                <h3 className="text-lg font-bold text-[#2C4B64] mb-6">Theme Preferences</h3>
                                <div className="space-y-4">
                                    <ThemeOption label="Light Mode" active />
                                    <ThemeOption label="Dark Mode" />
                                    <ThemeOption label="Neon Mode" />
                                </div>
                            </section>

                            {/* About App */}
                            <section ref={aboutRef} className="bg-[#fff] rounded-2xl p-8 border border-[#E5E0D8] scroll-mt-8">
                                <h3 className="text-lg font-bold text-[#2C4B64] mb-6">About App</h3>
                                <div className="space-y-4 mb-6 text-sm text-gray-600 leading-relaxed">
                                    <p>
                                        Our AI‑Driven Learning Management System is built to make learning smarter, faster, and personalized. Whether you’re a student, learner, or interview candidate, the app adapts to your goals and helps you prepare with confidence.
                                    </p>
                                    <p>
                                        <span className="font-bold text-[#2C4B64]">Features include:</span> AI‑generated notes, flashcards, quizzes, interview prep, progress dashboards and admin tools—all in one secure platform.
                                    </p>
                                    <p>
                                        <span className="font-bold text-[#2C4B64]">Our Vision:</span> We aim to redefine digital learning by blending cutting‑edge AI with intuitive design, creating a platform that’s not just functional but your personal learning companion for success.
                                    </p>
                                </div>
                            </section>
                        </div>

                        {/* Danger Zone */}
                        <section ref={dangerRef} className="bg-red-50 rounded-2xl p-8 border border-red-100 scroll-mt-8">
                            <h3 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h3>
                            <p className="text-sm text-red-600/80 mb-6">Once you delete your account, there is no going back. Please be certain.</p>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-red-800">Delete Account</h4>
                                    <p className="text-xs text-red-600/70 mt-1">Permanently remove your account and all data.</p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Delete Account?</h3>
                            <p className="text-sm text-center text-gray-500 mb-6">
                                Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be removed.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
            ? 'bg-[#3B6088] text-white shadow-lg shadow-blue-900/20'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
    >
        {icon}
        <span className="font-medium text-sm">{label}</span>
    </button>
);

const NavButton = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-sm font-medium ${active
            ? 'bg-[#F0F7FF] text-[#3B6088]'
            : 'text-gray-600 hover:bg-gray-50'
            }`}
    >
        <div className="flex items-center gap-3">
            {icon}
            <span>{label}</span>
        </div>
        {active && <ChevronRight size={16} />}
    </button>
);

const ThemeOption = ({ label, active }) => (
    <button className={`w-full flex items-center justify-between py-6 px-5 rounded-xl border transition-all ${active
        ? 'bg-[#E8F1F8] border-[#3B6088] text-[#2C4B64]'
        : 'bg-transparent border-gray-200 text-gray-500 hover:bg-white'
        }`}>
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${label === 'Light Mode' ? 'bg-white text-orange-400 shadow-sm' :
                label === 'Dark Mode' ? 'bg-[#2C4B64] text-white' : 'bg-purple-600 text-white'
                }`}>
                {label === 'Light Mode' ? <Zap size={16} /> :
                    label === 'Dark Mode' ? <Moon size={16} /> : <Zap size={16} />}
            </div>
            <span className="text-sm font-medium">{label}</span>
        </div>
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${active ? 'border-[#3B6088] bg-[#3B6088]' : 'border-gray-300'
            }`}>
            {active && <Check size={12} className="text-white" />}
        </div>
    </button>
);

const UserAvatar = ({ user, size = 'md' }) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [user.avatar]);

    const sizeClasses = {
        sm: 'w-10 h-10 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-full h-full text-3xl'
    };

    const getInitials = (name) => {
        if (!name) return 'G';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    if (user.avatar && !imgError) {
        return (
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden`}>
                <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white relative overflow-hidden`}
            style={{
                background: 'linear-gradient(135deg, #001f3f 0%, #14b8a6 100%)',
                boxShadow: '0 0 15px rgba(20, 184, 166, 0.6), inset 0 0 10px rgba(20, 184, 166, 0.3)',
                border: '2px solid #14b8a6'
            }}
        >
            <span className="relative z-10 drop-shadow-md tracking-wider">{getInitials(user.fullName)}</span>
        </div>
    );
};

export default Settings;
