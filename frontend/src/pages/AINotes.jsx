import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Zap,
    HelpCircle,
    Settings,
    Bell,
    Plus,
    LogOut,
    User,
    MoreHorizontal,
    Sparkles,
    ArrowRight,
    Loader2,
    ChevronDown,
    History,
    FileJson,
    Copy,
    Check,
    ArrowLeft,
    Clock,
    StickyNote,
    Layout,
    Search,
    ChevronLeft,
    ChevronRight,
    Filter,
    Trash2,
    Download
} from 'lucide-react';

const AINotes = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        fullName: 'Guest User',
        email: '',
        role: 'student',
        avatar: null
    });
    const [showSidebarProfileMenu, setShowSidebarProfileMenu] = useState(false);
    const [topicInput, setTopicInput] = useState('');
    const [filterType, setFilterType] = useState('Medium');
    const [loading, setLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [history, setHistory] = useState([]);
    const [viewMode, setViewMode] = useState('generator'); // 'generator', 'history', 'response'
    const [copied, setCopied] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [historyFilter, setHistoryFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [showHistoryFilterMenu, setShowHistoryFilterMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);
    const itemsPerPage = 6;

    const sidebarProfileRef = useRef(null);
    const filterMenuRef = useRef(null);
    const activePage = 'AI Notes';

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                if (parsedUser.role?.toLowerCase() !== 'student') {
                    navigate('/dashboard');
                }
            } catch (e) {
                console.error('Failed to parse user data');
            }
        } else {
            navigate('/');
        }

        const handleClickOutside = (event) => {
            if (sidebarProfileRef.current && !sidebarProfileRef.current.contains(event.target)) {
                setShowSidebarProfileMenu(false);
            }
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
                setShowFilterMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        fetchHistory();
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/ai/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setHistory(data);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const handleGenerate = async () => {
        if (!topicInput.trim()) return;

        setLoading(true);
        setAiResponse('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/ai/generate-notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    topic: topicInput,
                    filterType: filterType
                })
            });

            const data = await response.json();
            if (response.ok) {
                setAiResponse(data.response);
                setViewMode('response');
                fetchHistory(); // Refresh history
            } else {
                alert(data.error || 'Failed to generate notes');
            }
        } catch (error) {
            console.error('Error generating notes:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = (e, id) => {
        e.stopPropagation();
        setIdToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/ai/history/${idToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchHistory();
                setShowDeleteModal(false);
                setIdToDelete(null);
            } else {
                alert('Failed to delete history item');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            alert('Something went wrong');
        }
    };


    const handleDownload = () => {
        if (!aiResponse) return;
        const element = document.createElement("a");
        const file = new Blob([`Topic: ${topicInput}\nType: ${filterType}\n\n${aiResponse}`], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${topicInput.replace(/\s+/g, '_')}_notes.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleCopy = () => {
        if (!aiResponse) return;
        navigator.clipboard.writeText(aiResponse);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNewTopic = () => {
        setTopicInput('');
        setAiResponse('');
        setViewMode('generator');
        setLoading(false);
    };

    const filterOptions = [
        { id: 'Short', label: 'Short', desc: 'Summaries & bullets', icon: <StickyNote size={14} /> },
        { id: 'Medium', label: 'Medium', desc: 'Balanced depth', icon: <Layout size={14} /> },
        { id: 'Detailed', label: 'Detailed', desc: 'Complete analysis', icon: <FileText size={14} /> }
    ];

    const historyFilterOptions = [
        { id: 'All', label: 'All', icon: <History size={14} /> },
        ...filterOptions
    ];

    // Filter and Paginate History
    const filteredHistory = history.filter(item => {
        const matchesSearch = item.topic.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = historyFilter === 'All' || item.filter_type === historyFilter;
        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const currentHistoryItems = filteredHistory.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, historyFilter]);

    return (
        <div className="flex h-screen bg-[#FDFBF7] font-sans overflow-hidden no-scrollbar">
            {/* Sidebar */}
            <aside className="w-64 bg-[#2C4B64] text-white flex flex-col fixed h-full transition-all duration-300 z-20 no-scrollbar">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AcademIQ</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => navigate('/dashboard')} />
                    <SidebarItem icon={<BookOpen size={20} />} label="Courses" onClick={() => navigate('/courses')} />
                    <SidebarItem icon={<FileText size={20} />} label="AI Notes" active />
                    <SidebarItem icon={<Zap size={20} />} label="Flashcards" onClick={() => navigate('/flashcards')} />
                    <SidebarItem icon={<HelpCircle size={20} />} label="Quiz" onClick={() => navigate('/quizzes')} />
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
                                <p className="text-[10px] font-medium text-blue-300/50 tracking-widest truncate capitalize">
                                    {user.role?.toLowerCase()}
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
            <main className="flex-1 ml-64 p-4 md:p-8 lg:p-10 flex flex-col overflow-y-auto no-scrollbar">
                {/* Header Container */}
                <div className="w-full max-w-[1600px] mx-auto">
                    <header className="flex justify-between items-start mb-5 shrink-0">
                        <div>
                            <h1 className="text-2xl font-bold text-[#2C4B64]">AI Notes Generator</h1>
                            <p className="text-gray-500 text-sm mt-1">Transform topics into structured learning materials instantly.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setViewMode(viewMode === 'history' ? 'generator' : 'history')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all shadow-md font-semibold text-sm active:scale-95 ${viewMode === 'history'
                                    ? 'bg-white text-[#3B6088] border border-gray-200'
                                    : 'bg-[#3B6088] text-white hover:bg-[#2C4B64] shadow-blue-900/10'
                                    }`}
                            >
                                <History size={18} />
                                {viewMode === 'history' ? 'Back to Generator' : 'Recent Generations'}
                            </button>
                        </div>
                    </header>
                </div>

                {/* Content Area */}
                <div className={`flex-1 flex flex-col items-center justify-start w-full ${viewMode === 'generator' ? 'overflow-hidden' : 'pb-10 pt-4'}`}>

                    {viewMode === 'generator' && (
                        <div className="w-full h-full bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col items-center justify-center text-center px-6 md:px-12 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#3B6088]/10 to-transparent"></div>
                            <div className="w-16 h-16 bg-[#F0F7FF] rounded-2xl flex items-center justify-center mb-6">
                                <Sparkles className="text-[#3B6088] w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold text-[#1E293B] ">What do you want to learn today?</h2>
                            <p className="text-gray-500 text-sm mt-3 mb-12">AI-powered notes generator that helps you capture, organize, and simplify learning in a clear, structured way.</p>

                            <div className="w-full max-w-6xl flex flex-col md:flex-row gap-4 items-center">
                                {/* Custom Filter Dropdown */}
                                <div className="relative w-full md:w-auto min-w-[200px]" ref={filterMenuRef}>
                                    <button
                                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                                        className={`w-full flex items-center justify-between bg-gray-50 border rounded-2xl px-6 py-4 text-sm font-bold transition-all shadow-sm group ${showFilterMenu ? 'border-[#3B6088] ring-4 ring-[#3B6088]/5 bg-white' : 'border-gray-200 hover:border-[#3B6088]/30 hover:bg-white'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg transition-colors ${showFilterMenu ? 'bg-[#3B6088] text-white' : 'bg-white text-[#3B6088] border border-gray-100'}`}>
                                                {filterOptions.find(opt => opt.id === filterType)?.icon}
                                            </div>
                                            <span className="text-[#2C4B64]">{filterType}</span>
                                        </div>
                                        <ChevronDown className={`text-gray-400 transition-transform duration-300 ${showFilterMenu ? 'rotate-180 text-[#3B6088]' : ''}`} size={16} />
                                    </button>

                                    {showFilterMenu && (
                                        <div className="absolute bottom-[calc(100%+12px)] left-0 w-full bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            {filterOptions.map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => {
                                                        setFilterType(option.id);
                                                        setShowFilterMenu(false);
                                                    }}
                                                    className={`w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-all text-left relative ${filterType === option.id ? 'bg-blue-50/30' : ''}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${filterType === option.id ? 'bg-[#3B6088] text-white scale-110 shadow-lg shadow-blue-900/10' : 'bg-gray-100 text-gray-400 group-hover:bg-white'}`}>
                                                        {option.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-bold ${filterType === option.id ? 'text-[#3B6088]' : 'text-[#2C4B64]'}`}>{option.label}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">{option.desc}</p>
                                                    </div>
                                                    {filterType === option.id && (
                                                        <div className="w-1.5 h-1.5 bg-[#3B6088] rounded-full absolute right-4"></div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 w-full relative">
                                    <input
                                        type="text"
                                        placeholder="Enter a topic or concept..."
                                        className="w-full pl-6 pr-40 py-4 bg-white border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-blue-100/30 focus:border-[#3B6088]/30 transition-all placeholder:text-gray-400 shadow-sm"
                                        value={topicInput}
                                        onChange={(e) => setTopicInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading || !topicInput.trim()}
                                        className="absolute right-2 top-2 bottom-2 bg-[#3B6088] text-white px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-[#2C4B64] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-blue-900/10"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Generate
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-8 text-[10px] text-gray-400 justify-center font-medium">
                                <span className={filterType === 'Short' ? 'text-blue-500 font-bold' : ''}>Short: Bullet points & highlights</span>
                                <span className={filterType === 'Medium' ? 'text-blue-500 font-bold' : ''}>Medium: Balanced explanations</span>
                                <span className={filterType === 'Detailed' ? 'text-blue-500 font-bold' : ''}>Detailed: In-depth & examples</span>
                            </div>
                        </div>
                    )}

                    {viewMode === 'history' && (
                        <div className="w-full max-w-[1600px] animate-in fade-in slide-in-from-bottom-5 duration-500 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 md:p-8 lg:p-10 flex flex-col overflow-hidden">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                                <div className="flex-shrink-0">
                                    <h2 className="text-2xl font-bold text-[#2C4B64]">Generation History</h2>
                                    <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                                        <Clock size={14} />
                                        Review and manage your past AI-generated materials
                                    </p>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-4 flex-1 lg:max-w-2xl">
                                    <div className="relative flex-1 w-full">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search by topic or concept name..."
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6088]/10 focus:border-[#3B6088]/30 transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="relative min-w-[160px] w-full md:w-auto">
                                        <button
                                            onClick={() => setShowHistoryFilterMenu(!showHistoryFilterMenu)}
                                            className="w-full flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl text-sm font-bold text-[#2C4B64] hover:bg-gray-100 transition-all group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Filter size={16} className="text-[#3B6088]" />
                                                <span>{historyFilter}</span>
                                            </div>
                                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${showHistoryFilterMenu ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showHistoryFilterMenu && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                                {historyFilterOptions.map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => {
                                                            setHistoryFilter(opt.id);
                                                            setShowHistoryFilterMenu(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold transition-all hover:bg-gray-50 ${historyFilter === opt.id ? 'text-[#3B6088] bg-blue-50/50' : 'text-gray-600'}`}
                                                    >
                                                        {opt.icon}
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6 mb-8">
                                {currentHistoryItems.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setTopicInput(item.topic);
                                            setFilterType(item.filter_type);
                                            setAiResponse(item.response);
                                            setViewMode('response');
                                        }}
                                        className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 hover:border-[#3B6088]/30 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all cursor-pointer group flex flex-col h-full active:scale-[0.98]"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${item.filter_type === 'Short' ? 'bg-orange-50 text-orange-600' :
                                                item.filter_type === 'Medium' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-purple-50 text-purple-600'
                                                }`}>
                                                {item.filter_type}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-[#2C4B64] text-lg mb-3 group-hover:text-[#3B6088] line-clamp-2">{item.topic}</h4>
                                        <p className="text-xs text-gray-400 line-clamp-3 mb-6 flex-1">"{item.response.substring(0, 120)}..."</p>
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100/50">
                                            <button
                                                onClick={(e) => handleDelete(e, item.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete this note"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400 font-bold tracking-widest">Revisit Notes</span>
                                                <ArrowRight size={16} className="text-[#3B6088] transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredHistory.length === 0 && (
                                    <div className="col-span-full py-20 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search size={24} className="text-gray-400" />
                                        </div>
                                        <h3 className="font-bold text-gray-600">No results found</h3>
                                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-auto pt-8 border-t border-gray-100 flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-[#3B6088] hover:border-[#3B6088] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${currentPage === i + 1
                                                ? 'bg-[#3B6088] text-white shadow-lg shadow-blue-900/10'
                                                : 'text-gray-500 hover:bg-gray-100 hover:text-[#2C4B64]'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-[#3B6088] hover:border-[#3B6088] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {viewMode === 'response' && (
                        <div className="w-full max-w-[1600px] animate-in fade-in slide-in-from-bottom-5 duration-700">
                            {/* Actions Header */}
                            <div className="flex justify-between items-center mb-6">
                                <button
                                    onClick={() => setViewMode('history')}
                                    className="flex items-center gap-2 text-gray-500 hover:text-[#3B6088] font-bold text-sm transition-all group"
                                >
                                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                                    Back to History
                                </button>
                            </div>

                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 md:p-10 overflow-hidden">
                                <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="text-[#3B6088] w-6 h-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl md:text-2xl font-bold text-[#2C4B64] truncate">{topicInput}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex-shrink-0 ${filterType === 'Short' ? 'bg-orange-50 text-orange-600' :
                                                    filterType === 'Medium' ? 'bg-blue-50 text-blue-600' :
                                                        'bg-purple-50 text-purple-600'
                                                    }`}>
                                                    {filterType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleDownload}
                                            className="p-3 rounded-xl transition-all border border-gray-100 text-gray-400 hover:text-[#3B6088] hover:bg-gray-50 flex items-center justify-center"
                                            title="Download as text file"
                                        >
                                            <Download size={22} />
                                        </button>
                                        <button
                                            onClick={handleCopy}
                                            className={`p-3 rounded-xl transition-all border flex items-center justify-center flex-shrink-0 ${copied
                                                ? 'bg-green-50 border-green-200 text-green-600'
                                                : 'text-gray-400 hover:text-[#3B6088] hover:bg-gray-50 border-transparent hover:border-gray-100'}`}
                                            title={copied ? "Copied!" : "Copy to clipboard"}
                                        >
                                            {copied ? <Check size={22} /> : <Copy size={22} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="prose max-w-none text-gray-700 leading-relaxed text-sm md:text-md lg:text-lg">
                                    <MarkdownRenderer content={aiResponse} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Custom Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
                                <Trash2 className="text-red-500 w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-[#2C4B64] mb-2">Delete Note</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-8 px-4">
                                Are you sure you want to remove this note?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-gray-50 text-gray-600 font-bold text-sm hover:bg-gray-100 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20 transition-all active:scale-95"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simplified Markdown Renderer to handle basic formatting without external libs
const MarkdownRenderer = ({ content }) => {
    if (!content) return null;

    const sections = content.split('\n');

    return (
        <div className="space-y-4">
            {sections.map((line, index) => {
                // Headings
                if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-xl font-bold text-[#2C4B64] mt-6 mb-2">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-2xl font-bold text-[#2C4B64] mt-8 mb-3 border-b border-gray-100 pb-2">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('# ')) {
                    return <h1 key={index} className="text-3xl font-bold text-[#2C4B64] mb-4">{line.replace('# ', '')}</h1>;
                }

                // Bullet points
                if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                        <div key={index} className="flex gap-3 ml-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#3B6088] mt-2 flex-shrink-0"></div>
                            <p className="flex-1">{parseInlineStyles(line.substring(2))}</p>
                        </div>
                    );
                }

                // Numbered lists (simplified)
                if (/^\d+\. /.test(line)) {
                    const num = line.match(/^\d+/)[0];
                    return (
                        <div key={index} className="flex gap-3 ml-4">
                            <span className="font-bold text-[#3B6088] min-w-[1.25rem]">{num}.</span>
                            <p className="flex-1">{parseInlineStyles(line.replace(/^\d+\. /, ''))}</p>
                        </div>
                    );
                }

                // Empty lines
                if (line.trim() === '') {
                    return <div key={index} className="h-2"></div>;
                }

                // Regular paragraphs
                return <p key={index} className="leading-relaxed">{parseInlineStyles(line)}</p>;
            })}
        </div>
    );
};

// Helper for bold and italic
const parseInlineStyles = (text) => {
    // Bold: **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = text.split(boldRegex);

    return parts.map((part, i) => {
        if (i % 2 === 1) {
            return <strong key={i} className="font-bold text-[#1E293B]">{part}</strong>;
        }

        // Italic: *text* (simplified - only if bold is not found in the part)
        const italicRegex = /\*(.*?)\*/g;
        const subParts = part.split(italicRegex);
        return subParts.map((subPart, j) => {
            if (j % 2 === 1) {
                return <em key={j} className="italic text-gray-800">{subPart}</em>;
            }
            return subPart;
        });
    });
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

    useEffect(() => {
        setImgError(false);
    }, [user.avatar]);

    const sizeClasses = {
        sm: 'w-10 h-10 text-xs',
        md: 'w-10 h-10 text-sm',
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
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white/20`}>
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

export default AINotes;
