import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Zap,
    HelpCircle,
    Briefcase,
    Settings,
    Search,
    Bell,
    User,
    LogOut,
    Users,
    GraduationCap,
    DollarSign,
    Award,
    MoreVertical,
    Filter,
    Plus,
    Calendar,
    ChevronDown,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    ArrowRight,
    Check,
    X,
    Clock,
    List,
    ClipboardList,
    MoreHorizontal
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import Toast from '../components/Toast';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const [user] = useState({
        fullName: 'Super Admin',
        email: 'superadmin@gmail.com',
        role: 'Admin',
        avatar: null
    });
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSidebarProfileMenu, setShowSidebarProfileMenu] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [currentCoursePage, setCurrentCoursePage] = useState(1);
    const [courseSearchQuery, setCourseSearchQuery] = useState('');
    const [courseStatusFilter, setCourseStatusFilter] = useState('all');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const coursesPerPage = 6;
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [quizzes, setQuizzes] = useState([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(true);
    const [currentQuizPage, setCurrentQuizPage] = useState(1);
    const [quizSearchQuery, setQuizSearchQuery] = useState('');
    const [quizStatusFilter, setQuizStatusFilter] = useState('all');
    const [showQuizStatusDropdown, setShowQuizStatusDropdown] = useState(false);
    const quizzesPerPage = 6;
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeCourses: 0,
        totalQuizzes: 0,
        revenue: '$45.2k'
    });

    // Analytics State
    const [userGrowthData, setUserGrowthData] = useState([]);
    const [userGrowthDays, setUserGrowthDays] = useState(7);
    const [loadingUserGrowth, setLoadingUserGrowth] = useState(true);
    const [showUserGrowthFilter, setShowUserGrowthFilter] = useState(false);

    const [courseGrowthData, setCourseGrowthData] = useState([]);
    const [courseGrowthDays, setCourseGrowthDays] = useState(7);
    const [courseGrowthStatus, setCourseGrowthStatus] = useState('all');
    const [loadingCourseGrowth, setLoadingCourseGrowth] = useState(true);
    const [showCourseDaysFilter, setShowCourseDaysFilter] = useState(false);
    const [showCourseStatusChartFilter, setShowCourseStatusChartFilter] = useState(false);

    const profileMenuRef = useRef(null);
    const recentUsersRef = useRef(null);
    const courseManagementRef = useRef(null);
    const quizManagementRef = useRef(null);
    const sidebarProfileRef = useRef(null);

    useEffect(() => {
        fetchUsers();
        fetchCourses();
        fetchQuizzes();
        fetchUserGrowth();
        fetchCourseGrowth();
    }, []);

    useEffect(() => {
        fetchUserGrowth();
    }, [userGrowthDays]);

    useEffect(() => {
        fetchCourseGrowth();
    }, [courseGrowthDays, courseGrowthStatus]);

    const fetchUserGrowth = async () => {
        setLoadingUserGrowth(true);
        try {
            const response = await fetch(`http://localhost:5000/api/analytics/user-growth?days=${userGrowthDays}`);
            if (response.ok) {
                const data = await response.json();
                setUserGrowthData(data);
            }
        } catch (error) {
            console.error('Error fetching user growth data:', error);
        } finally {
            setLoadingUserGrowth(false);
        }
    };

    const fetchCourseGrowth = async () => {
        setLoadingCourseGrowth(true);
        try {
            const response = await fetch(`http://localhost:5000/api/analytics/course-growth?days=${courseGrowthDays}&status=${courseGrowthStatus}`);
            if (response.ok) {
                const data = await response.json();
                setCourseGrowthData(data);
            }
        } catch (error) {
            console.error('Error fetching course growth data:', error);
        } finally {
            setLoadingCourseGrowth(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const fetchCourses = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/courses');
            if (response.ok) {
                const data = await response.json();
                // Handle both array and object responses
                const coursesList = Array.isArray(data) ? data : (data.courses || []);
                setCourses(coursesList);
                setStats(prev => ({ ...prev, activeCourses: coursesList.length }));
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            setCourses([]);
        } finally {
            setLoadingCourses(false);
        }
    };

    const handleUpdateCourseStatus = async (courseId, status) => {
        try {
            const response = await fetch(`http://localhost:5000/api/courses/${courseId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                setCourses(prev => prev.map(c =>
                    c.id === courseId ? { ...c, status } : c
                ));
                showToast(`Course ${status} successfully!`, 'success');
            } else {
                showToast('Failed to update course status', 'error');
            }
        } catch (error) {
            console.error('Error updating course status:', error);
            showToast('An error occurred while updating course status', 'error');
        }
    };

    const fetchQuizzes = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/quizzes');
            if (response.ok) {
                const data = await response.json();
                // Handle both array and object responses
                const quizzesList = Array.isArray(data) ? data : (data.quizzes || []);
                setQuizzes(quizzesList);
                setStats(prev => ({ ...prev, totalQuizzes: quizzesList.length }));
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            setQuizzes([]);
        } finally {
            setLoadingQuizzes(false);
        }
    };

    const handleUpdateQuizStatus = async (quizId, status) => {
        try {
            const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                setQuizzes(prev => prev.map(q =>
                    q.id === quizId ? { ...q, status } : q
                ));
                showToast(`Quiz ${status} successfully!`, 'success');
            } else {
                showToast('Failed to update quiz status', 'error');
            }
        } catch (error) {
            console.error('Error updating quiz status:', error);
            showToast('An error occurred while updating quiz status', 'error');
        }
    };

    const scrollToSection = (ref) => {
        if (ref && ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/users');
            if (response.ok) {
                const data = await response.json();
                const usersList = Array.isArray(data) ? data : [];
                setUsers(usersList);
                setStats(prev => ({ ...prev, totalUsers: usersList.length }));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            const response = await fetch(`http://localhost:5000/api/auth/users/${deleteId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setUsers(prev => (Array.isArray(prev) ? prev : []).filter(u => u.id !== deleteId));
                setShowDeleteModal(false);
                setDeleteId(null);
                showToast('User Deleted Successfully', 'success');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
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

    const filteredCourses = (Array.isArray(courses) ? courses : []).filter(course => {
        const matchesSearch = (course.title || '').toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
            (course.instructor_name || '').toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
            (course.objective || '').toLowerCase().includes(courseSearchQuery.toLowerCase());
        const matchesStatus = courseStatusFilter === 'all' || course.status === courseStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const paginatedCourses = filteredCourses.slice(
        (currentCoursePage - 1) * coursesPerPage,
        currentCoursePage * coursesPerPage
    );

    const totalCoursePages = Math.ceil(filteredCourses.length / coursesPerPage);

    const filteredQuizzes = (Array.isArray(quizzes) ? quizzes : []).filter(quiz => {
        const matchesSearch = (quiz.title || '').toLowerCase().includes(quizSearchQuery.toLowerCase()) ||
            (quiz.instructor_name || '').toLowerCase().includes(quizSearchQuery.toLowerCase()) ||
            (quiz.explanation || '').toLowerCase().includes(quizSearchQuery.toLowerCase());
        const matchesStatus = quizStatusFilter === 'all' || quiz.status === quizStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const paginatedQuizzes = filteredQuizzes.slice(
        (currentQuizPage - 1) * quizzesPerPage,
        currentQuizPage * quizzesPerPage
    );

    const totalQuizPages = Math.ceil(filteredQuizzes.length / quizzesPerPage);

    return (
        <div className="flex min-h-screen bg-[#FDFBF7] font-sans">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            {/* Sidebar - Replicating Dashboard Sidebar */}
            <aside className="w-64 bg-[#2C4B64] text-white flex flex-col fixed h-full transition-all duration-300 z-20">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AcademIQ</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
                </nav>

                <div className="p-4 mt-auto border-t border-white/5">
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
            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 text-[#3B6088]">Dashboard Overview</h1>

                    <div className="flex items-center gap-4">

                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="focus:outline-none transition-transform active:scale-95"
                            >
                                <UserAvatar user={user} size="md" />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-gray-50">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{user.fullName}</p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    </div>
                                    <div className="border-t border-gray-50 py-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </header>

                {/* Functionality: Quick Navigation & Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Quick Navigation Card */}
                    <div className="p-5 rounded-xl border border-gray-100 bg-[#FAF9F6] flex flex-col shadow-sm">
                        <p className="text-[#3B6088] text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Zap size={12} className="text-orange-500 fill-orange-500" /> Quick Navigation
                        </p>
                        <div className="flex flex-col gap-1.5">
                            <button
                                onClick={() => scrollToSection(recentUsersRef)}
                                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-100 rounded-lg hover:border-[#3B6088] hover:text-[#3B6088] transition-all group active:scale-95 shadow-sm"
                            >
                                Users Control
                                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button
                                onClick={() => scrollToSection(courseManagementRef)}
                                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-100 rounded-lg hover:border-[#3B6088] hover:text-[#3B6088] transition-all group active:scale-95 shadow-sm"
                            >
                                Courses Control
                                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button
                                onClick={() => scrollToSection(quizManagementRef)}
                                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-100 rounded-lg hover:border-[#3B6088] hover:text-[#3B6088] transition-all group active:scale-95 shadow-sm"
                            >
                                Quizzes Control
                                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>

                    <StatCard
                        title="TOTAL USERS"
                        value={stats.totalUsers.toLocaleString()}
                        icon={<Users className="text-[#3B6088]" size={24} />}
                        bg="bg-[#F0F4F8]"
                    />
                    <StatCard
                        title="TOTAL COURSES"
                        value={stats.activeCourses.toLocaleString()}
                        icon={<GraduationCap className="text-orange-500" size={24} />}
                        bg="bg-[#FFF8F0]"
                    />
                    <StatCard
                        title="TOTAL QUIZZES"
                        value={stats.totalQuizzes.toLocaleString()}
                        icon={<ClipboardList className="text-purple-600" size={24} />}
                        bg="bg-[#F8F0FF]"
                    />
                </div>

                {/* Middle Grid: Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* User Growth Chart */}
                    <div className="bg-[#FAF9F6] p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">User Analytics</h3>
                                <p className="text-xs text-gray-500">User growth trends</p>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserGrowthFilter(!showUserGrowthFilter)}
                                    className="flex items-center gap-2 text-xs font-bold bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm text-gray-700 hover:border-[#3B6088] transition-all"
                                >
                                    Last {userGrowthDays} Days <ChevronDown size={14} className={showUserGrowthFilter ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                </button>
                                {showUserGrowthFilter && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setShowUserGrowthFilter(false)}></div>
                                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-50 py-1 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {[7, 30].map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => {
                                                        setUserGrowthDays(d);
                                                        setShowUserGrowthFilter(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${userGrowthDays === d ? 'text-[#3B6088] bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    Last {d} Days
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 min-h-[250px] relative">
                            {loadingUserGrowth ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-[#3B6088] animate-spin" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B6088" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B6088" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                fontSize: '12px',
                                                fontWeight: '700'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            name="New Users"
                                            stroke="#3B6088"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorUser)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Course Creation Chart */}
                    <div className="bg-[#FAF9F6] p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Course Analytics</h3>
                                <p className="text-xs text-gray-500">Course creation trends</p>
                            </div>
                            <div className="flex gap-2">
                                {/* Days Filter */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowCourseDaysFilter(!showCourseDaysFilter)}
                                        className="flex items-center gap-2 text-xs font-bold bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm text-gray-700 hover:border-[#3B6088] transition-all"
                                    >
                                        Last {courseGrowthDays} Days <ChevronDown size={14} className={showCourseDaysFilter ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                    </button>
                                    {showCourseDaysFilter && (
                                        <>
                                            <div className="fixed inset-0 z-30" onClick={() => setShowCourseDaysFilter(false)}></div>
                                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-50 py-1 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {[7, 30].map(d => (
                                                    <button
                                                        key={d}
                                                        onClick={() => {
                                                            setCourseGrowthDays(d);
                                                            setShowCourseDaysFilter(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${courseGrowthDays === d ? 'text-[#3B6088] bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                                                    >
                                                        Last {d} Days
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Status Filter */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowCourseStatusChartFilter(!showCourseStatusChartFilter)}
                                        className="flex items-center gap-2 text-xs font-bold bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm text-gray-700 hover:border-[#3B6088] transition-all"
                                    >
                                        {courseGrowthStatus === 'all' ? 'All Statuses' : courseGrowthStatus.charAt(0).toUpperCase() + courseGrowthStatus.slice(1)}
                                        <ChevronDown size={14} className={showCourseStatusChartFilter ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                    </button>
                                    {showCourseStatusChartFilter && (
                                        <>
                                            <div className="fixed inset-0 z-30" onClick={() => setShowCourseStatusChartFilter(false)}></div>
                                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-50 py-1 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {['all', 'accepted', 'rejected', 'pending'].map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => {
                                                            setCourseGrowthStatus(s);
                                                            setShowCourseStatusChartFilter(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${courseGrowthStatus === s ? 'text-[#3B6088] bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                                                    >
                                                        {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[250px] relative">
                            {loadingCourseGrowth ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-[#3B6088] animate-spin" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={courseGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F3F4F6' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                fontSize: '12px',
                                                fontWeight: '700'
                                            }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            name="Courses Created"
                                            radius={[6, 6, 0, 0]}
                                            animationDuration={1500}
                                        >
                                            {courseGrowthData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B6088' : '#60A5FA'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Grid: Recent Users */}
                <div className="grid grid-cols-1 gap-8 mb-8" ref={recentUsersRef}>
                    {/* Recent Users */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800">Recent Users</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase border-b border-gray-100">
                                    <tr>
                                        <th className="pb-3 font-medium">User</th>
                                        <th className="pb-3 font-medium">Role</th>
                                        <th className="pb-3 font-medium">Created Date</th>
                                        <th className="pb-3 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-8 h-8 text-[#3B6088] animate-spin" />
                                                    <span className="text-gray-500">Loading users...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : users.length > 0 ? (
                                        users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((u) => (
                                            <UserRow
                                                key={u.id}
                                                id={u.id}
                                                name={u.full_name}
                                                email={u.email}
                                                role={u.role || 'Student'}
                                                createdAt={u.created_at}
                                                avatar={u.avatar_url}
                                                onDelete={() => handleDeleteClick(u.id)}
                                            />
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="py-8 text-center text-gray-500">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Scroller */}
                        {!loading && users.length > itemsPerPage && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 tracking-wider">
                                    Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, users.length)}</span> of <span className="text-gray-900">{users.length}</span> users
                                </p>
                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                                    >
                                        <ChevronLeft size={18} strokeWidth={2.5} />
                                    </button>

                                    <div className="flex items-center gap-1 px-2 overflow-x-auto max-w-[200px] scrollbar-hide no-scrollbar">
                                        {Array.from({ length: Math.ceil(users.length / itemsPerPage) }).map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1
                                                    ? 'bg-[#3B6088] text-white shadow-md'
                                                    : 'text-gray-500 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(users.length / itemsPerPage), prev + 1))}
                                        disabled={currentPage === Math.ceil(users.length / itemsPerPage)}
                                        className={`p-2 rounded-lg transition-all ${currentPage === Math.ceil(users.length / itemsPerPage) ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                                    >
                                        <ChevronRight size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center gap-4 mb-4 text-red-600">
                                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                                    <Trash2 size={24} />
                                </div>
                                <h3 className="text-xl font-bold">Delete User</h3>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this user? This will remove all associated data.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-200 transition-all active:scale-95"
                                >
                                    Delete User
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Course Management Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8" ref={courseManagementRef}>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-[#3B6088]">Course Management</h3>
                            <p className="text-sm text-gray-500">Review and moderate course submissions.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search courses or instructors..."
                                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6088] w-64 transition-all"
                                    value={courseSearchQuery}
                                    onChange={(e) => {
                                        setCourseSearchQuery(e.target.value);
                                        setCurrentCoursePage(1);
                                    }}
                                />
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                                >
                                    <Filter size={16} />
                                    <span>
                                        {courseStatusFilter === 'all' ? 'All Statuses' :
                                            courseStatusFilter === 'accepted' ? 'Accepted' :
                                                courseStatusFilter === 'rejected' ? 'Rejected' : 'Pending Review'}
                                    </span>
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${showStatusDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showStatusDropdown && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setShowStatusDropdown(false)}
                                        ></div>
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {[
                                                { id: 'all', label: 'All Statuses' },
                                                { id: 'accepted', label: 'Accepted' },
                                                { id: 'rejected', label: 'Rejected' },
                                                { id: 'pending', label: 'Pending Review' }
                                            ].map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => {
                                                        setCourseStatusFilter(option.id);
                                                        setCurrentCoursePage(1);
                                                        setShowStatusDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${courseStatusFilter === option.id
                                                        ? 'bg-blue-50 text-[#3B6088] font-bold'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {option.label}
                                                    {courseStatusFilter === option.id && <Check size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {loadingCourses ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                            <Loader2 size={40} className="animate-spin text-[#3B6088]" />
                            <p className="font-medium">Loading courses...</p>
                        </div>
                    ) : filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedCourses.map((course) => (
                                <CourseCard key={course.id} course={course} onUpdateStatus={handleUpdateCourseStatus} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                            <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">
                                {courseSearchQuery ? `No courses found matching "${courseSearchQuery}"` : "No courses available for review."}
                            </p>
                        </div>
                    )}

                    {/* Course Pagination */}
                    {!loadingCourses && filteredCourses.length > coursesPerPage && (
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-50">
                            <p className="text-xs font-semibold text-gray-500 tracking-wider">
                                Showing <span className="text-gray-900">{(currentCoursePage - 1) * coursesPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentCoursePage * coursesPerPage, filteredCourses.length)}</span> of <span className="text-gray-900">{filteredCourses.length}</span> courses
                            </p>
                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                <button
                                    onClick={() => setCurrentCoursePage(prev => Math.max(1, prev - 1))}
                                    disabled={currentCoursePage === 1}
                                    className={`p-2 rounded-lg transition-all ${currentCoursePage === 1 ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                                >
                                    <ChevronLeft size={18} strokeWidth={2.5} />
                                </button>

                                <div className="flex items-center gap-1 px-2 overflow-x-auto max-w-[200px] no-scrollbar">
                                    {Array.from({ length: totalCoursePages }).map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentCoursePage(i + 1)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentCoursePage === i + 1
                                                ? 'bg-[#3B6088] text-white shadow-md'
                                                : 'text-gray-500 hover:bg-gray-100'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentCoursePage(prev => Math.min(totalCoursePages, prev + 1))}
                                    disabled={currentCoursePage === totalCoursePages}
                                    className={`p-2 rounded-lg transition-all ${currentCoursePage === totalCoursePages ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                                >
                                    <ChevronRight size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quiz Management Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8" ref={quizManagementRef}>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-[#3B6088]">Quiz Management</h3>
                            <p className="text-sm text-gray-500">Review and moderate quiz submissions from instructors.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search quizzes or instructors..."
                                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6088] w-64 transition-all"
                                    value={quizSearchQuery}
                                    onChange={(e) => {
                                        setQuizSearchQuery(e.target.value);
                                        setCurrentQuizPage(1);
                                    }}
                                />
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setShowQuizStatusDropdown(!showQuizStatusDropdown)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                                >
                                    <Filter size={16} />
                                    <span>
                                        {quizStatusFilter === 'all' ? 'All Statuses' :
                                            quizStatusFilter === 'accepted' ? 'Accepted' :
                                                quizStatusFilter === 'rejected' ? 'Rejected' : 'Pending Review'}
                                    </span>
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${showQuizStatusDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showQuizStatusDropdown && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setShowQuizStatusDropdown(false)}
                                        ></div>
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {[
                                                { id: 'all', label: 'All Statuses' },
                                                { id: 'accepted', label: 'Accepted' },
                                                { id: 'rejected', label: 'Rejected' },
                                                { id: 'pending', label: 'Pending Review' }
                                            ].map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => {
                                                        setQuizStatusFilter(option.id);
                                                        setCurrentQuizPage(1);
                                                        setShowQuizStatusDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${quizStatusFilter === option.id
                                                        ? 'bg-blue-50 text-[#3B6088] font-bold'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {option.label}
                                                    {quizStatusFilter === option.id && <Check size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {loadingQuizzes ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                            <Loader2 size={40} className="animate-spin text-[#3B6088]" />
                            <p className="font-medium">Loading quizzes...</p>
                        </div>
                    ) : filteredQuizzes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedQuizzes.map((quiz) => (
                                <QuizCard key={quiz.id} quiz={quiz} onUpdateStatus={handleUpdateQuizStatus} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                            <Zap size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">
                                {quizSearchQuery ? `No quizzes found matching "${quizSearchQuery}"` : "No quizzes available for review."}
                            </p>
                        </div>
                    )}

                    {/* Quiz Pagination */}
                    {!loadingQuizzes && filteredQuizzes.length > quizzesPerPage && (
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-50">
                            <p className="text-xs font-semibold text-gray-500 tracking-wider">
                                Showing <span className="text-gray-900">{(currentQuizPage - 1) * quizzesPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentQuizPage * quizzesPerPage, filteredQuizzes.length)}</span> of <span className="text-gray-900">{filteredQuizzes.length}</span> quizzes
                            </p>
                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                <button
                                    onClick={() => setCurrentQuizPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentQuizPage === 1}
                                    className={`p-2 rounded-lg transition-all ${currentQuizPage === 1 ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                                >
                                    <ChevronLeft size={18} strokeWidth={2.5} />
                                </button>

                                <div className="flex items-center gap-1 px-2 overflow-x-auto max-w-[200px] no-scrollbar">
                                    {Array.from({ length: totalQuizPages }).map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentQuizPage(i + 1)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentQuizPage === i + 1
                                                ? 'bg-[#3B6088] text-white shadow-md'
                                                : 'text-gray-500 hover:bg-gray-100'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentQuizPage(prev => Math.min(totalQuizPages, prev + 1))}
                                    disabled={currentQuizPage === totalQuizPages}
                                    className={`p-2 rounded-lg transition-all ${currentQuizPage === totalQuizPages ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                                >
                                    <ChevronRight size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
            ? 'bg-[#3B6088] text-white shadow-lg shadow-blue-900/20'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}>
        {icon}
        <span className="font-medium text-sm">{label}</span>
    </button>
);

const UserAvatar = ({ user, size = 'md' }) => {
    const [imgError, setImgError] = useState(false);

    // Reset error state if user.avatar changes
    useEffect(() => {
        setImgError(false);
    }, [user.avatar]);

    const sizeClasses = {
        sm: 'w-10 h-10 text-xs',
        md: 'w-10 h-10 text-sm', // Header size
        lg: 'w-12 h-12 text-base'
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
                background: 'linear-gradient(135deg, #001f3f 0%, #14b8a6 100%)', // Deep Navy to Vibrant Teal
                boxShadow: '0 0 15px rgba(20, 184, 166, 0.6), inset 0 0 10px rgba(20, 184, 166, 0.3)', // Glowing Teal Rim
                border: '2px solid #14b8a6' // Teal Border
            }}
        >
            <span className="relative z-10 drop-shadow-md tracking-wider">{getInitials(user.fullName)}</span>
        </div>
    );
};

const StatCard = ({ title, value, trend, trendColor, icon, bg }) => (
    <div className={`p-5 rounded-xl border border-gray-100 ${bg} flex flex-col justify-center shadow-sm h-full`}>
        <div className="flex justify-between items-center transition-transform hover:scale-[1.02]">
            <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">{value}</h3>
            </div>
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-50">
                {icon}
            </div>
        </div>
        {trend && (
            <div className={`mt-3 text-xs font-bold ${trendColor} flex items-center gap-1`}>
                {trend}
            </div>
        )}
    </div>
);

const UserRow = ({ id, name, email, role, createdAt, avatar, onDelete }) => {
    const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const roleColors = {
        'admin': 'bg-red-50 text-red-600 border-red-100',
        'instructor': 'bg-purple-50 text-purple-600 border-purple-100',
        'student': 'bg-blue-50 text-blue-600 border-blue-100'
    };

    const displayRole = role?.toLowerCase() || 'student';
    const roleClass = roleColors[displayRole] || 'bg-gray-50 text-gray-600 border-gray-100';

    return (
        <tr className="hover:bg-gray-50/50 transition-colors group">
            <td className="py-4 pr-4">
                <div className="flex items-center gap-3">
                    <UserAvatar user={{ fullName: name, avatar: avatar }} size="sm" />
                    <div>
                        <p className="font-bold text-gray-800 text-sm">{name}</p>
                        <p className="text-xs text-gray-400 font-medium">{email}</p>
                    </div>
                </div>
            </td>
            <td className="py-4">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleClass}`}>
                    {role}
                </span>
            </td>
            <td className="py-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                    <Calendar size={14} className="text-gray-400" />
                    {formattedDate}
                </div>
            </td>
            <td className="py-4 text-right">
                <button
                    onClick={onDelete}
                    className="flex items-center gap-1.5 ml-auto px-3 py-1.5 text-xs font-bold text-red-600 border border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-200 rounded-lg transition-all active:scale-95"
                    title="Delete User"
                >
                    <Trash2 size={14} />
                    Delete
                </button>
            </td>
        </tr>
    );
};

const CourseCard = ({ course, onUpdateStatus }) => {
    const bannerUrl = course.banner_image
        ? (course.banner_image.startsWith('http') ? course.banner_image : `http://localhost:5000${course.banner_image}`)
        : "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    const getStatusStyles = (status) => {
        switch (status) {
            case 'accepted':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-white/90 text-[#3B6088] border-gray-100';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'accepted': return 'Accepted';
            case 'rejected': return 'Rejected';
            default: return 'Pending Review';
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="h-44 relative group">
                <img
                    src={bannerUrl}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-white text-xs font-medium bg-[#3B6088]/80 backdrop-blur-sm px-2 py-1 rounded">
                        {course.modules_count} Modules
                    </p>
                </div>
                <span className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm border backdrop-blur-sm ${getStatusStyles(course.status)}`}>
                    {getStatusLabel(course.status)}
                </span>
            </div>
            <div className="p-5">
                <h4 className="font-bold text-gray-800 mb-2 line-clamp-1 h-6">{course.title}</h4>
                <p className="text-xs text-gray-500 mb-5 line-clamp-2 h-8 leading-relaxed">
                    {course.objective || "No objective provided for this course submission."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2.5">
                        <UserAvatar
                            user={{
                                fullName: course.instructor_name || "Unknown",
                                avatar: course.instructor_avatar
                            }}
                            size="sm"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700" title={course.instructor_email}>{course.instructor_name || "Unknown"}</span>
                            <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">{course.instructor_role || "Instructor"}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => onUpdateStatus(course.id, 'rejected')}
                            className={`p-1.5 rounded-lg transition-all shadow-sm border active:scale-95 ${course.status === 'rejected'
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600'
                                }`}
                            title="Reject Course"
                            disabled={course.status === 'rejected'}
                        >
                            <X size={16} strokeWidth={3} />
                        </button>
                        <button
                            onClick={() => onUpdateStatus(course.id, 'accepted')}
                            className={`p-1.5 rounded-lg transition-all shadow-sm border active:scale-95 ${course.status === 'accepted'
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white hover:border-green-600'
                                }`}
                            title="Accept Course"
                            disabled={course.status === 'accepted'}
                        >
                            <Check size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuizCard = ({ quiz, onUpdateStatus }) => {
    const getStatusStyles = (status) => {
        switch (status) {
            case 'accepted':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-orange-50 text-orange-600 border-orange-100';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'accepted': return 'Accepted';
            case 'rejected': return 'Rejected';
            default: return 'Pending Review';
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm border ${getStatusStyles(quiz.status)}`}>
                        {getStatusLabel(quiz.status)}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50 px-2 py-1 rounded">
                        <Clock size={12} />
                        {new Date(quiz.created_at).toLocaleDateString()}
                    </div>
                </div>

                <h4 className="font-bold text-gray-800 mb-2 line-clamp-1 h-6">{quiz.title}</h4>
                <p className="text-xs text-gray-500 mb-6 line-clamp-3 h-12 leading-relaxed">
                    {quiz.explanation || "No description provided for this quiz submission."}
                </p>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-[#3B6088] font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                        <List size={14} />
                        <span>{quiz.questions_count} Questions</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2.5">
                        <UserAvatar
                            user={{
                                fullName: quiz.instructor_name || "Unknown",
                                avatar: quiz.instructor_avatar
                            }}
                            size="sm"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700">{quiz.instructor_name || "Unknown"}</span>
                            <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Instructor</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => onUpdateStatus(quiz.id, 'rejected')}
                            className={`p-1.5 rounded-lg transition-all shadow-sm border active:scale-95 ${quiz.status === 'rejected'
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white hover:border-red-600'
                                }`}
                            title="Reject Quiz"
                            disabled={quiz.status === 'rejected'}
                        >
                            <X size={16} strokeWidth={3} />
                        </button>
                        <button
                            onClick={() => onUpdateStatus(quiz.id, 'accepted')}
                            className={`p-1.5 rounded-lg transition-all shadow-sm border active:scale-95 ${quiz.status === 'accepted'
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-600 hover:text-white hover:border-green-600'
                                }`}
                            title="Accept Quiz"
                            disabled={quiz.status === 'accepted'}
                        >
                            <Check size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
