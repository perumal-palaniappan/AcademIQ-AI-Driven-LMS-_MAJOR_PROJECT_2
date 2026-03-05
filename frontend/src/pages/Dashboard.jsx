import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Zap,
    HelpCircle,
    Settings,
    Search,
    Bell,
    Plus,
    Monitor,
    PenTool,
    CheckSquare,
    CheckCircle,
    Clock,
    Bot,
    ChevronRight,
    MoreHorizontal,
    LogOut,
    User
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        fullName: 'Guest User',
        email: '',
        avatar: null
    });
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSidebarProfileMenu, setShowSidebarProfileMenu] = useState(false);
    const [headerSearch, setHeaderSearch] = useState('');
    const [stats, setStats] = useState({
        completedCourses: 0,
        aiNotesGenerated: 0,
        quizAttempts: 0,
        flashcardsGenerated: 0
    });
    const [loadingStats, setLoadingStats] = useState(false);
    const [inProgressCourses, setInProgressCourses] = useState([]);
    const [instructorCourses, setInstructorCourses] = useState([]);
    const [carouselOffset, setCarouselOffset] = useState(0);
    const [activeActivityType, setActiveActivityType] = useState('notes'); // 'notes' or 'flashcards'
    const [activeActivityRange, setActiveActivityRange] = useState(7); // 7 or 30
    const [activityChartData, setActivityChartData] = useState([]);
    const [showRangeDropdown, setShowRangeDropdown] = useState(false);
    const profileMenuRef = useRef(null);
    const sidebarProfileRef = useRef(null);
    const rangeDropdownRef = useRef(null);
    const activePage = 'Dashboard';

    const handleHeaderSearch = (e) => {
        if (e.key === 'Enter' && headerSearch.trim()) {
            navigate(`/courses?search=${encodeURIComponent(headerSearch.trim())}`);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        let currentUser = null;
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                currentUser = parsedUser;
            } catch (e) {
                console.error('Failed to parse user data');
            }
        }

        if (currentUser) {
            const role = currentUser.role?.toLowerCase();
            fetchStats(currentUser.id, role);
            if (role === 'student') {
                fetchInProgressCourses(currentUser.id);
                fetchLearningActivity(currentUser.id, activeActivityType, activeActivityRange, 'student');
            } else if (role === 'instructor') {
                fetchInstructorCourses(currentUser.id);
                // Set default type to 'courses' for instructor if it's currently a student type
                if (activeActivityType === 'notes' || activeActivityType === 'flashcards') {
                    setActiveActivityType('courses');
                }
                fetchLearningActivity(currentUser.id, activeActivityType === 'notes' || activeActivityType === 'flashcards' ? 'courses' : activeActivityType, activeActivityRange, 'instructor');
            }
        }

        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
            if (sidebarProfileRef.current && !sidebarProfileRef.current.contains(event.target)) {
                setShowSidebarProfileMenu(false);
            }
            if (rangeDropdownRef.current && !rangeDropdownRef.current.contains(event.target)) {
                setShowRangeDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (user.id) {
            fetchLearningActivity(user.id, activeActivityType, activeActivityRange, user.role?.toLowerCase());
        }
    }, [activeActivityType, activeActivityRange]);

    const fetchLearningActivity = async (userId, type, range, role) => {
        try {
            const endpoint = role === 'instructor'
                ? `http://localhost:5000/api/instructor/activity?instructorId=${userId}&type=${type}&range=${range}`
                : `http://localhost:5000/api/student/learning-activity?userId=${userId}&type=${type}&range=${range}`;

            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                setActivityChartData(data);
            }
        } catch (error) {
            console.error('Error fetching activity data:', error);
        }
    };

    const fetchStats = async (userId, role) => {
        setLoadingStats(true);
        try {
            const endpoint = role?.toLowerCase() === 'instructor'
                ? `http://localhost:5000/api/instructor/stats?instructorId=${userId}`
                : `http://localhost:5000/api/student/stats?userId=${userId}`;

            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchInProgressCourses = async (userId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/student/courses?userId=${userId}&filter=in_progress`);
            if (response.ok) {
                const data = await response.json();
                setInProgressCourses(data.courses || []);
            }
        } catch (error) {
            console.error('Error fetching in progress courses:', error);
        }
    };

    const fetchInstructorCourses = async (userId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/instructor/recent-courses?instructorId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setInstructorCourses(data.courses || []);
            }
        } catch (error) {
            console.error('Error fetching instructor courses:', error);
        }
    };

    const nextSlide = () => {
        const courseList = user.role?.toLowerCase() === 'instructor' ? instructorCourses : inProgressCourses;
        if (carouselOffset + 3 < courseList.length) {
            setCarouselOffset(prev => prev + 1);
        }
    };

    const prevSlide = () => {
        if (carouselOffset > 0) {
            setCarouselOffset(prev => prev - 1);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="flex min-h-screen bg-[#FDFBF7] font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-[#2C4B64] text-white flex flex-col fixed h-full transition-all duration-300 z-20">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AcademIQ</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
                    <SidebarItem icon={<BookOpen size={20} />} label="Courses" onClick={() => navigate('/courses')} />
                    {user.role?.toLowerCase() === 'student' && (
                        <SidebarItem
                            icon={<FileText size={20} />}
                            label="AI Notes"
                            active={activePage === 'AI Notes'}
                            onClick={() => navigate('/ai-notes')}
                        />
                    )}
                    {user.role?.toLowerCase() === 'student' && (
                        <SidebarItem
                            icon={<Zap size={20} />}
                            label="Flashcards"
                            active={activePage === 'Flashcards'}
                            onClick={() => navigate('/flashcards')}
                        />
                    )}
                    <SidebarItem icon={<HelpCircle size={20} />} label="Quiz" active={activePage === 'Quiz'} onClick={() => navigate('/quizzes')} />
                </nav>

                <div className="p-4 mt-auto border-t border-white/5">
                    <SidebarItem icon={<Settings size={20} />} label="Settings" onClick={() => navigate('/settings')} />

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
                    <div className="flex items-center text-gray-500 text-sm">
                        {/* <span>Home</span>
                        <ChevronRight size={16} className="mx-2" /> */}
                        <span className="text-gray-800 font-medium">Dashboard</span>
                    </div>

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
                                    <div className="py-1">
                                        <button
                                            onClick={() => navigate('/settings')}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Settings size={16} />
                                            Settings
                                        </button>
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

                {/* Welcome Section */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user.fullName}! 👋</h1>
                        <p className="text-gray-500">Here's what's happening with your learning journey today.</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {user.role?.toLowerCase() === 'instructor' ? (
                        <>
                            <StatCard
                                title="Courses Created"
                                value={stats.courseCreated || 0}
                                trend=""
                                trendUp={true}
                                icon={<BookOpen className="text-blue-600" size={24} />}
                                bg="bg-blue-50"
                            />
                            <StatCard
                                title="Courses Accepted"
                                value={stats.courseAccepted || 0}
                                trend=""
                                trendUp={true}
                                icon={<CheckCircle className="text-green-600" size={24} />}
                                bg="bg-green-50"
                            />
                            <StatCard
                                title="Quizzes Created"
                                value={stats.quizCreated || 0}
                                trend=""
                                trendUp={false}
                                icon={<FileText className="text-orange-600" size={24} />}
                                bg="bg-orange-50"
                            />
                            <StatCard
                                title="Quizzes Accepted"
                                value={stats.quizAccepted || 0}
                                trend=""
                                trendUp={true}
                                icon={<CheckSquare className="text-purple-600" size={24} />}
                                bg="bg-purple-50"
                            />
                        </>
                    ) : (
                        <>
                            <StatCard
                                title="Active Courses"
                                value={stats.completedCourses || 0}
                                trend=""
                                trendUp={true}
                                icon={<Monitor className="text-blue-600" size={24} />}
                                bg="bg-blue-50"
                            />
                            <StatCard
                                title="AI Notes Generated"
                                value={stats.aiNotesGenerated || 0}
                                trend=""
                                trendUp={true}
                                icon={<PenTool className="text-green-600" size={24} />}
                                bg="bg-green-50"
                            />
                            <StatCard
                                title="Quizzes Completed"
                                value={stats.quizAttempts || 0}
                                trend=""
                                trendUp={false}
                                icon={<CheckSquare className="text-orange-600" size={24} />}
                                bg="bg-orange-50"
                            />
                            <StatCard
                                title="AI Flashcards Generated"
                                value={stats.flashcardsGenerated || 0}
                                trend=""
                                trendUp={true}
                                icon={<Zap className="text-purple-600" size={24} />}
                                bg="bg-purple-50"
                            />
                        </>
                    )}
                </div>

                {/* Middle Section Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-stretch">
                    {/* Learning Activity Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden relative group">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg mb-1">
                                    {user.role?.toLowerCase() === 'instructor' ? 'Creation Activity' : 'Learning Activity'}
                                </h3>
                                <p className="text-xs text-gray-400 font-medium">
                                    {user.role?.toLowerCase() === 'instructor' ? 'Daily summary of your content creation' : 'Daily summary of your AI interactions'}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                                {user.role?.toLowerCase() === 'instructor' ? (
                                    <>
                                        <button
                                            onClick={() => setActiveActivityType('courses')}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeActivityType === 'courses' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            Courses Count
                                        </button>
                                        <button
                                            onClick={() => setActiveActivityType('quizzes')}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeActivityType === 'quizzes' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            Quizzes Count
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setActiveActivityType('notes')}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeActivityType === 'notes' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            AI Notes
                                        </button>
                                        <button
                                            onClick={() => setActiveActivityType('flashcards')}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeActivityType === 'flashcards' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            AI Flashcards
                                        </button>
                                    </>
                                )}
                                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                <div className="relative" ref={rangeDropdownRef}>
                                    <button
                                        onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-800 transition-all ${showRangeDropdown ? 'bg-white shadow-sm' : 'hover:bg-white'}`}
                                    >
                                        {activeActivityRange === 7 ? 'This Week' : 'This Month'}
                                        <ChevronRight size={14} className={`text-gray-400 transition-transform duration-200 ${showRangeDropdown ? 'rotate-[-90deg]' : 'rotate-90'}`} />
                                    </button>

                                    {showRangeDropdown && (
                                        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                                            <button
                                                onClick={() => {
                                                    setActiveActivityRange(7);
                                                    setShowRangeDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${activeActivityRange === 7 ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                This Week
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveActivityRange(30);
                                                    setShowRangeDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${activeActivityRange === 30 ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                This Month
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[280px] relative mt-4">
                            {activityChartData.length > 0 ? (
                                user.role?.toLowerCase() === 'instructor' ? (
                                    <InstructorActivityVisual data={activityChartData} type={activeActivityType} />
                                ) : (
                                    <ActivityVisual data={activityChartData} type={activeActivityType} />
                                )
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-300 text-sm italic">
                                    No activity recorded for this period
                                </div>
                            )
                            }
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="h-full">

                        {/* Quick Actions */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
                            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Zap size={18} className="text-yellow-500 fill-yellow-500" />
                                Quick Actions
                            </h3>
                            <div className="flex-1 flex flex-col gap-4">
                                {user.role?.toLowerCase() === 'instructor' ? (
                                    <>
                                        <button
                                            onClick={() => navigate('/courses', { state: { action: 'create' } })}
                                            className="w-full flex-1 flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300 group text-left relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                <BookOpen size={22} />
                                            </div>
                                            <div className="flex-1 z-10">
                                                <h4 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-blue-700 transition-colors">Create Course</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed">Design and publish new learning paths with modules and interactive concepts.</p>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all z-10" />
                                        </button>

                                        <button
                                            onClick={() => navigate('/quizzes', { state: { action: 'create' } })}
                                            className="w-full flex-1 flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all duration-300 group text-left relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                <HelpCircle size={22} />
                                            </div>
                                            <div className="flex-1 z-10">
                                                <h4 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-orange-700 transition-colors">Create Quiz</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed">Build engaging assessments with multiple choice and multi-select questions.</p>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all z-10" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => navigate('/ai-notes')}
                                            className="w-full flex-1 flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all duration-300 group text-left relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                <FileText size={22} />
                                            </div>
                                            <div className="flex-1 z-10">
                                                <h4 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-purple-700 transition-colors">Generate Notes</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed">Transform study materials into structured AI-powered notes instantly.</p>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all z-10" />
                                        </button>

                                        <button
                                            onClick={() => navigate('/flashcards')}
                                            className="w-full flex-1 flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-300 group text-left relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                <Zap size={22} />
                                            </div>
                                            <div className="flex-1 z-10">
                                                <h4 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-blue-700 transition-colors">Create Flashcards</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed">Turn topics into interactive cards for faster and efficient learning.</p>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all z-10" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Continue Learning / My Courses Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-gray-800">
                            {user.role?.toLowerCase() === 'instructor' ? 'Recently Created Courses' : 'Continue Learning'}
                        </h3>
                        <button
                            onClick={() => navigate('/courses')}
                            className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1 group"
                        >
                            View All Courses
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>

                    {(user.role?.toLowerCase() === 'instructor' ? instructorCourses : inProgressCourses).length > 0 ? (
                        <div className="relative group/carousel px-12">
                            {/* Side Arrows */}
                            {(user.role?.toLowerCase() === 'instructor' ? instructorCourses : inProgressCourses).length > 3 && (
                                <>
                                    <button
                                        onClick={prevSlide}
                                        disabled={carouselOffset === 0}
                                        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center transition-all duration-300 ${carouselOffset === 0 ? 'opacity-0 scale-90 cursor-not-allowed' : 'opacity-100 scale-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-90 text-gray-600'}`}
                                    >
                                        <ChevronRight size={20} className="rotate-180" />
                                    </button>
                                    <button
                                        onClick={nextSlide}
                                        disabled={carouselOffset + 3 >= (user.role?.toLowerCase() === 'instructor' ? instructorCourses : inProgressCourses).length}
                                        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center transition-all duration-300 ${carouselOffset + 3 >= (user.role?.toLowerCase() === 'instructor' ? instructorCourses : inProgressCourses).length ? 'opacity-0 scale-90 cursor-not-allowed' : 'opacity-100 scale-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-90 text-gray-600'}`}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500">
                                {(user.role?.toLowerCase() === 'instructor' ? instructorCourses : inProgressCourses)
                                    .slice(carouselOffset, carouselOffset + 3)
                                    .map((course) => (
                                        <CourseCard
                                            key={course.id}
                                            image={course.banner_image ? (course.banner_image.startsWith('http') ? course.banner_image : `http://localhost:5000${course.banner_image}`) : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                                            category={user.role?.toLowerCase() === 'instructor' ? (course.status?.charAt(0).toUpperCase() + course.status?.slice(1)) : (course.instructor_name || "Instructor")}
                                            title={course.title}
                                            code={`#${course.id}`}
                                            description={course.objective}
                                            enrolled={course.modules_count || 0}
                                            createdAt={course.created_at}
                                            status={course.status}
                                            {...(user.role?.toLowerCase() === 'instructor' ? {} : { progress: course.progress })}
                                        />
                                    ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
                            <Monitor className="mx-auto text-gray-300 mb-4" size={48} />
                            <h4 className="text-gray-800 font-bold mb-2">
                                {user.role?.toLowerCase() === 'instructor' ? 'No Courses Created' : 'No Courses in Progress'}
                            </h4>
                            <p className="text-gray-500 text-sm mb-6">
                                {user.role?.toLowerCase() === 'instructor'
                                    ? 'Start by creating your first educational course.'
                                    : 'Start your learning journey by exploring our available courses.'}
                            </p>
                            <button
                                onClick={() => user.role?.toLowerCase() === 'instructor' ? navigate('/courses', { state: { action: 'create' } }) : navigate('/courses')}
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                            >
                                {user.role?.toLowerCase() === 'instructor' ? 'Create Course' : 'Browse Courses'}
                            </button>
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

const StatCard = ({ title, value, trend, trendUp, icon, bg }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-sm font-medium mb-1 h-10 line-clamp-2 leading-tight flex items-center">{title}</p>
                <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${bg} ml-4 shrink-0`}>
                {icon}
            </div>
        </div>
        {trend && (
            <div className={`flex items-center text-xs font-medium mt-4 ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
                <span className="mr-1">{trend}</span>
            </div>
        )}
    </div>
);

const CourseCard = ({ image, category, title, code, description, enrolled, progress, createdAt, status }) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'accepted': return 'bg-green-50 text-green-700 border-green-200';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
        >
            <div className="h-44 overflow-hidden relative">
                <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className={`absolute top-4 left-4 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider shadow-sm border ${progress !== undefined ? 'bg-white/90 text-gray-700 border-white/50' : getStatusColor(status)}`}>
                    {category}
                </div>
                {progress !== undefined && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200/50">
                        <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}
            </div>
            <div className="p-6 flex flex-col flex-1">
                <h4 className="font-bold text-gray-800 text-base line-clamp-1 mb-2">{title}</h4>
                <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed flex-1">{description}</p>
                <div className="pt-4 border-t border-gray-50 mt-auto">
                    <div className="flex items-center justify-between">
                        {progress !== undefined ? (
                            <>
                                <span className="text-[11px] font-bold text-gray-400 tracking-tight">Progress</span>
                                <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{progress}%</span>
                            </>
                        ) : (
                            <>
                                <div className="px-2.5 py-1 rounded-lg bg-emerald-50/50 border border-emerald-100/50">
                                    <span className="text-[10px] font-medium text-emerald-600">{enrolled} {parseInt(enrolled) === 1 ? 'Module' : 'Modules'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400">
                                    <Clock size={12} strokeWidth={2.5} />
                                    <span className="text-[10px] font-semibold tracking-tight">{formatDate(createdAt)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

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

const ActivityVisual = ({ data, type }) => {
    const maxVal = Math.max(...data.map(d => d.count), 5);
    const color = type === 'flashcards' ? '#3B82F6' : '#8B5CF6'; // Blue vs Purple
    const isMonthly = data.length > 7;

    return (
        <div className="w-full h-full flex flex-col">
            <div className={`flex-1 flex items-end justify-between ${isMonthly ? 'gap-0.5' : 'gap-4'} px-2 relative`}>
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-12 pt-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-full border-t border-gray-50 h-px"></div>
                    ))}
                </div>

                {data.map((d, i) => {
                    const height = (d.count / maxVal) * 100;
                    // Show labels every 5 days for monthly view, otherwise show all
                    const showLabel = !isMonthly || i === 0 || i === data.length - 1 || (i + 1) % 5 === 0;

                    return (
                        <div key={i} className="flex-1 flex flex-col items-center group/bar z-10">
                            <div className="relative w-full flex justify-center items-end h-[220px]">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 scale-90 group-hover/bar:scale-100 pointer-events-none z-20">
                                    <div className="bg-gray-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                        <p className="text-[8px] text-gray-400 mb-0.5 uppercase tracking-tighter">{d.date}</p>
                                        {d.count} {type === 'notes' ? 'Notes' : 'Decks'}
                                    </div>
                                    <div className="w-2 h-2 bg-gray-800 rotate-45 mx-auto -mt-1 shadow-lg"></div>
                                </div>

                                {/* Bar */}
                                <div
                                    className={`w-full ${isMonthly ? 'sm:w-3' : 'sm:w-8'} rounded-t-lg transition-all duration-700 ease-out relative overflow-hidden ring-1 ring-white/20`}
                                    style={{
                                        height: `${Math.max(height, 2)}%`,
                                        background: d.count > 0
                                            ? `linear-gradient(to top, ${color}30, ${color})`
                                            : `${color}08`,
                                        boxShadow: d.count > 0 ? `0 0 12px ${color}20` : 'none'
                                    }}
                                >
                                    {/* Glass reflection top */}
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 skew-y-[-15deg] -translate-y-2 pointer-events-none"></div>

                                    {/* Value indicator at top of bar */}
                                    {d.count > 0 && (
                                        <div
                                            className="absolute top-0 left-0 w-full h-1 shadow-[0_0_10px_white]"
                                            style={{ backgroundColor: color }}
                                        ></div>
                                    )}
                                </div>
                            </div>

                            {/* X-Axis Label */}
                            <div className="h-6 mt-4 flex items-center">
                                {showLabel && (
                                    <span className={`text-[9px] font-black tracking-tighter uppercase transition-colors duration-300 ${d.count > 0 ? 'text-gray-800' : 'text-gray-400/60'}`}>
                                        {isMonthly ? d.date.split(' ')[0] : d.day_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const InstructorActivityVisual = ({ data, type }) => {
    const maxVal = Math.max(...data.map(d => d.count), 5);
    const color = type === 'quizzes' ? '#10B981' : '#3B82F6'; // Emerald vs Blue
    const isMonthly = data.length > 7;

    const width = 800;
    const height = 240;
    const padding = 40;

    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * (width - 2 * padding) + padding,
        y: height - (d.count / maxVal) * (height - 2 * padding) - 60
    }));

    const generatePath = () => {
        if (points.length < 2) return "";
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cp1x = p0.x + (p1.x - p0.x) / 2;
            path += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        return path;
    };

    const areaPath = `${generatePath()} L ${points[points.length - 1].x} ${height - 40} L ${points[0].x} ${height - 40} Z`;

    return (
        <div className="w-full h-full flex flex-col pt-4">
            <div className="flex-1 relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id={`area-grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id={`line-grad-${type}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                            <stop offset="50%" stopColor={color} />
                            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
                        </linearGradient>
                        <filter id="path-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Horizontal Grid */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                        <g key={idx}>
                            <line
                                x1={padding}
                                y1={p * (height - 100) + padding}
                                x2={width - padding}
                                y2={p * (height - 100) + padding}
                                stroke="#F8FAFC"
                                strokeWidth="1"
                            />
                            <text
                                x={padding - 10}
                                y={p * (height - 100) + padding + 4}
                                textAnchor="end"
                                fill="#94A3B8"
                                fontSize="10"
                                className="font-medium"
                            >
                                {Math.round(maxVal - (p * maxVal))}
                            </text>
                        </g>
                    ))}

                    {/* Area Fill */}
                    <path d={areaPath} fill={`url(#area-grad-${type})`} className="opacity-0 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }} />

                    {/* The Path */}
                    <path
                        d={generatePath()}
                        fill="none"
                        stroke={`url(#line-grad-${type})`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        filter="url(#path-glow)"
                        className="animate-draw-path"
                        style={{
                            strokeDasharray: 2000,
                            strokeDashoffset: 0,
                        }}
                    />

                    {/* Data Interaction Points */}
                    {data.map((d, i) => {
                        const p = points[i];
                        const showLabel = !isMonthly || i % 5 === 0 || i === data.length - 1;

                        return (
                            <g key={i} className="group/point">
                                {d.count > 0 && (
                                    <>
                                        {/* Drop Line */}
                                        <line
                                            x1={p.x}
                                            y1={p.y}
                                            x2={p.x}
                                            y2={height - 40}
                                            stroke={color}
                                            strokeWidth="1.5"
                                            strokeDasharray="4 4"
                                            className="opacity-0 group-hover/point:opacity-20 transition-opacity"
                                        />

                                        <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r="5"
                                            fill="white"
                                            stroke={color}
                                            strokeWidth="2.5"
                                            className="transition-all duration-300 group-hover/point:r-7 group-hover/point:stroke-width-3"
                                            style={{ filter: d.count > 0 ? `drop-shadow(0 0 6px ${color}40)` : 'none' }}
                                        />

                                        {/* Tooltip */}
                                        <g className="opacity-0 group-hover/point:opacity-100 transition-all duration-300 translate-y-2 group-hover/point:translate-y-0 pointer-events-none">
                                            <rect x={p.x - 22} y={p.y - 42} width="44" height="26" rx="13" fill="white" stroke={color} strokeWidth="1" />
                                            <text x={p.x} y={p.y - 25} textAnchor="middle" fill={color} fontSize="11" className="font-bold">
                                                {d.count}
                                            </text>
                                            <path d={`M ${p.x - 4} ${p.y - 16} L ${p.x} ${p.y - 10} L ${p.x + 4} ${p.y - 16}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                                        </g>
                                    </>
                                )}

                                {showLabel && (
                                    <g>
                                        <text
                                            x={p.x}
                                            y={height - 15}
                                            textAnchor="middle"
                                            fill={d.count > 0 ? '#475569' : '#94A3B8'}
                                            fontSize="10"
                                            className="font-semibold tracking-wide"
                                        >
                                            {isMonthly ? d.date.split(' ')[0] : d.day_name}
                                        </text>
                                        <circle cx={p.x} cy={height - 40} r="2" fill={d.count > 0 ? color : '#E2E8F0'} />
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
            <style jsx>{`
                @keyframes draw-path {
                    from { stroke-dashoffset: 2000; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-draw-path {
                    animation: draw-path 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                .animate-fade-in {
                    animation: fade-in 1s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
