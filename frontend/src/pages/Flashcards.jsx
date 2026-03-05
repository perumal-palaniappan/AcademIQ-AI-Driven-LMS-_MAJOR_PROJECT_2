import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Zap,
    HelpCircle,
    Settings,
    LogOut,
    User,
    MoreHorizontal,
    Sparkles,
    ArrowRight,
    Loader2,
    ChevronDown,
    History,
    Search,
    ChevronLeft,
    ChevronRight,
    Filter,
    Trash2,
    Calendar,
    Award,
    Layers,
    RotateCcw,
    Clock,
    ArrowLeft
} from 'lucide-react';

const Flashcards = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        fullName: 'Guest User',
        email: '',
        role: 'student',
        avatar: null
    });
    const [showSidebarProfileMenu, setShowSidebarProfileMenu] = useState(false);
    const [topicInput, setTopicInput] = useState('');
    const [difficulty, setDifficulty] = useState('Intermediate');
    const [cardCount, setCardCount] = useState('10');
    const [loading, setLoading] = useState(false);
    const [flashcards, setFlashcards] = useState([]);
    const [history, setHistory] = useState([]);
    const [viewMode, setViewMode] = useState('generator'); // 'generator', 'history', 'deck'
    const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
    const [showCountMenu, setShowCountMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [historyFilter, setHistoryFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [showHistoryFilterMenu, setShowHistoryFilterMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deckToDelete, setDeckToDelete] = useState(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const itemsPerPage = 6;
    const sidebarProfileRef = useRef(null);
    const difficultyMenuRef = useRef(null);
    const countMenuRef = useRef(null);
    const historyFilterRef = useRef(null);

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
            if (difficultyMenuRef.current && !difficultyMenuRef.current.contains(event.target)) {
                setShowDifficultyMenu(false);
            }
            if (countMenuRef.current && !countMenuRef.current.contains(event.target)) {
                setShowCountMenu(false);
            }
            if (historyFilterRef.current && !historyFilterRef.current.contains(event.target)) {
                setShowHistoryFilterMenu(false);
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
            const response = await fetch('http://localhost:5000/api/flashcards/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const handleGenerate = async () => {
        if (!topicInput.trim()) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/flashcards/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    topic: topicInput,
                    difficulty: difficulty,
                    cardCount: parseInt(cardCount)
                })
            });

            if (response.ok) {
                const data = await response.json();
                setFlashcards(data.cards);
                setViewMode('deck');
                setCurrentCardIndex(0);
                setIsFlipped(false);
                fetchHistory(); // Refresh history
            } else {
                const err = await response.json();
                alert(err.error || 'Failed to generate flashcards');
            }
        } catch (error) {
            console.error('Error generating flashcards:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadingMessages = [
        "Analyzing topic...",
        "Drafting concepts...",
        "Creating smart cards...",
        "Polishing definitions...",
        "Almost there..."
    ];

    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

    useEffect(() => {
        let interval;
        if (loading) {
            interval = setInterval(() => {
                setLoadingMsgIndex(prev => (prev + 1) % loadingMessages.length);
            }, 3000);
        } else {
            setLoadingMsgIndex(0);
        }
        return () => clearInterval(interval);
    }, [loading]);

    const handleDelete = (e, id) => {
        e.stopPropagation();
        setDeckToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deckToDelete) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/flashcards/deck/${deckToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchHistory();
                setShowDeleteModal(false);
                setDeckToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting deck:', error);
        }
    };

    const difficultyOptions = [
        { id: 'Beginner', label: 'Beginner', desc: 'Fundamental concepts', icon: <Sparkles size={14} /> },
        { id: 'Intermediate', label: 'Intermediate', desc: 'Balanced complexity', icon: <Layers size={14} /> },
        { id: 'Advanced', label: 'Advanced', desc: 'Deep technical details', icon: <Zap size={14} /> }
    ];

    const cardCountOptions = [
        { id: '5', label: '5 Cards' },
        { id: '10', label: '10 Cards' },
        { id: '15', label: '15 Cards' },
        { id: '20', label: '20 Cards' }
    ];

    const filteredHistory = history.filter(item => {
        const matchesSearch = item.topic.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = historyFilter === 'All' || item.difficulty === historyFilter;
        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const currentHistoryItems = filteredHistory.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePracticeDeck = (deck) => {
        setTopicInput(deck.topic);
        setDifficulty(deck.difficulty);
        setFlashcards(deck.cards);
        setViewMode('deck');
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

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
                    <SidebarItem icon={<FileText size={20} />} label="AI Notes" onClick={() => navigate('/ai-notes')} />
                    <SidebarItem icon={<Zap size={20} />} label="Flashcards" active />
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
            <main className="flex-1 ml-64 p-4 md:p-6 lg:p-8 flex flex-col overflow-y-auto no-scrollbar">
                <div className="w-full max-w-[1600px] mx-auto">
                    <header className="flex justify-between items-start mb-5 shrink-0">
                        <div>
                            <h1 className="text-2xl font-bold text-[#2C4B64]">AI Flashcards Generator</h1>
                            <p className="text-gray-500 text-sm mt-1">Generate smart flashcards to master any topic effortlessly.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setViewMode(viewMode === 'history' ? 'generator' : 'history');
                                    setCurrentPage(1);
                                }}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all shadow-md font-semibold text-sm active:scale-95 ${viewMode === 'history'
                                    ? 'bg-white text-[#3B6088] border border-gray-200'
                                    : 'bg-[#3B6088] text-white hover:bg-[#2C4B64] shadow-blue-900/10'
                                    }`}
                            >
                                <History size={18} />
                                {viewMode === 'history' ? 'Back to Generator' : 'Recent Decks'}
                            </button>
                        </div>
                    </header>
                </div>

                <div className={`flex-1 flex flex-col items-center justify-start w-full ${viewMode === 'generator' ? 'overflow-hidden' : 'pb-10 pt-4'}`}>
                    {viewMode === 'generator' && (
                        <div className="w-full h-full bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 flex flex-col items-center justify-center text-center px-6 md:px-12 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#3B6088]/10 to-transparent"></div>
                            <div className="w-16 h-16 bg-[#F0F7FF] rounded-2xl flex items-center justify-center mb-6">
                                <Zap className="text-[#3B6088] w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold text-[#1E293B] ">Ready to test your knowledge?</h2>
                            <p className="text-gray-500 text-sm mt-3 mb-10">Create personalized flashcard decks that adapt to your pace and match your level of difficulty.</p>

                            <div className="w-full max-w-6xl flex flex-col gap-6">
                                <div className="flex flex-col md:flex-row gap-4 items-center">
                                    {/* Difficulty Filter */}
                                    <div className="relative w-full md:w-1/4" ref={difficultyMenuRef}>
                                        <label className="block text-left text-[10px] font-bold text-gray-400 tracking-widest mb-2 ml-2">Complexity</label>
                                        <button
                                            onClick={() => setShowDifficultyMenu(!showDifficultyMenu)}
                                            className={`w-full flex items-center justify-between bg-gray-50 border rounded-2xl px-6 py-4 text-sm font-bold transition-all shadow-sm group ${showDifficultyMenu ? 'border-[#3B6088] ring-4 ring-[#3B6088]/5 bg-white' : 'border-gray-200 hover:border-[#3B6088]/30 hover:bg-white'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg transition-colors ${showDifficultyMenu ? 'bg-[#3B6088] text-white' : 'bg-white text-[#3B6088] border border-gray-100'}`}>
                                                    {difficultyOptions.find(opt => opt.id === difficulty)?.icon}
                                                </div>
                                                <span className="text-[#2C4B64]">{difficulty}</span>
                                            </div>
                                            <ChevronDown className={`text-gray-400 transition-transform duration-300 ${showDifficultyMenu ? 'rotate-180 text-[#3B6088]' : ''}`} size={16} />
                                        </button>

                                        {showDifficultyMenu && (
                                            <div className="absolute bottom-[calc(100%+8px)] left-0 w-full bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                {difficultyOptions.map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            setDifficulty(option.id);
                                                            setShowDifficultyMenu(false);
                                                        }}
                                                        className={`w-full flex items-center gap-4 px-4 py-2 hover:bg-gray-50 transition-all text-left relative ${difficulty === option.id ? 'bg-blue-50/30' : ''}`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${difficulty === option.id ? 'bg-[#3B6088] text-white scale-110 shadow-lg shadow-blue-900/10' : 'bg-gray-100 text-gray-400 group-hover:bg-white'}`}>
                                                            {option.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className={`text-sm font-bold ${difficulty === option.id ? 'text-[#3B6088]' : 'text-[#2C4B64]'}`}>{option.label}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium">{option.desc}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Count Filter */}
                                    <div className="relative w-full md:w-1/4" ref={countMenuRef}>
                                        <label className="block text-left text-[10px] font-bold text-gray-400 tracking-widest mb-2 ml-2">Deck Size</label>
                                        <button
                                            onClick={() => setShowCountMenu(!showCountMenu)}
                                            className={`w-full flex items-center justify-between bg-gray-50 border rounded-2xl px-6 py-4 text-sm font-bold transition-all shadow-sm group ${showCountMenu ? 'border-[#3B6088] ring-4 ring-[#3B6088]/5 bg-white' : 'border-gray-200 hover:border-[#3B6088]/30 hover:bg-white'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-white text-[#3B6088] border border-gray-100">
                                                    <Layers size={14} />
                                                </div>
                                                <span className="text-[#2C4B64]">{cardCount} Cards</span>
                                            </div>
                                            <ChevronDown className={`text-gray-400 transition-transform duration-300 ${showCountMenu ? 'rotate-180 text-[#3B6088]' : ''}`} size={16} />
                                        </button>

                                        {showCountMenu && (
                                            <div className="absolute bottom-[calc(100%+8px)] left-0 w-full bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                {cardCountOptions.map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            setCardCount(option.id);
                                                            setShowCountMenu(false);
                                                        }}
                                                        className={`w-full flex items-center gap-4 px-4 py-2 hover:bg-gray-50 transition-all text-left relative ${cardCount === option.id ? 'bg-blue-50/30' : ''}`}
                                                    >
                                                        <div className="px-4 py-1">
                                                            <p className={`text-sm font-bold ${cardCount === option.id ? 'text-[#3B6088]' : 'text-[#2C4B64]'}`}>{option.label}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Topic Input */}
                                    <div className="flex-1 w-full relative pt-6">
                                        <input
                                            type="text"
                                            placeholder="Enter topic or concept..."
                                            className="w-full pl-6 pr-40 py-4 bg-white border border-gray-200 rounded-2xl text-base focus:outline-none focus:ring-4 focus:ring-blue-100/30 focus:border-[#3B6088]/30 transition-all placeholder:text-gray-400 shadow-sm"
                                            value={topicInput}
                                            onChange={(e) => setTopicInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                                            disabled={loading}
                                        />
                                        <button
                                            onClick={handleGenerate}
                                            disabled={loading || !topicInput.trim()}
                                            className="absolute right-2 top-8 bottom-2 bg-[#3B6088] text-white px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-[#2C4B64] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-blue-900/10 min-w-[160px] justify-center"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    <span className="animate-pulse">{loadingMessages[loadingMsgIndex]}</span>
                                                </>
                                            ) : (
                                                <>
                                                    Generate
                                                    <ArrowRight size={18} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-8 text-[10px] text-gray-400 justify-center font-medium">
                                    <span className={difficulty === 'Beginner' ? 'text-[#3B6088] font-bold' : ''}>Beginner: Fundamental concepts</span>
                                    <span className={difficulty === 'Intermediate' ? 'text-[#3B6088] font-bold' : ''}>Intermediate: Balanced complexity</span>
                                    <span className={difficulty === 'Advanced' ? 'text-[#3B6088] font-bold' : ''}>Advanced: Deep technical details</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'deck' && (
                        <div className="w-full h-full max-w-5xl lg:max-w-6xl flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-5 duration-700 px-4">
                            <div className="w-full flex justify-between items-center mb-8">
                                <button
                                    onClick={() => setViewMode('generator')}
                                    className="flex items-center gap-2 text-gray-500 hover:text-[#3B6088] font-bold text-sm transition-all group"
                                >
                                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                                    Back to Generation
                                </button>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-[#3B6088] tracking-widest bg-[#3B6088]/5 px-3 py-1 rounded-full">
                                        {topicInput}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 tracking-widest px-3 py-1 bg-gray-50 rounded-full">
                                        Card {currentCardIndex + 1} of {flashcards.length}
                                    </span>
                                </div>
                            </div>

                            <div
                                onClick={() => setIsFlipped(!isFlipped)}
                                className="w-full h-[400px] md:h-[500px] lg:h-[550px] cursor-pointer perspective-1000 group relative"
                            >
                                <div className={`relative w-full h-full transition-all duration-700 preserve-3d shadow-[0_20px_60px_-15px_rgba(44,75,100,0.15)] rounded-[3rem] ${isFlipped ? 'rotate-y-180' : ''}`}>
                                    {/* Front */}
                                    <div className="absolute inset-0 bg-white rounded-[3rem] p-12 flex flex-col items-center justify-center text-center backface-hidden overflow-hidden">


                                        <span className="text-[12px] font-bold text-[#3B6088]/40 tracking-[0.3em] mb-8 relative z-10">Flashcard Question</span>
                                        <h2 className="text-2xl md:text-3xl font-bold text-[#2C4B64] leading-tight max-w-2xl relative z-10 drop-shadow-sm">
                                            {flashcards[currentCardIndex]?.question}
                                        </h2>
                                        <div className="mt-16 text-[#3B6088]/50 text-[12px] font-bold tracking-widest animate-pulse relative z-10">
                                            Click to reveal answer
                                        </div>

                                        <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-50 overflow-hidden">
                                            <div
                                                className="h-full bg-[#3B6088] transition-all duration-500"
                                                style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Back */}
                                    <div className="absolute inset-0 bg-[#2C4B64] rounded-[3rem] p-12 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180 text-white overflow-hidden shadow-inner">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#3B6088]/20 to-transparent"></div>

                                        <span className="text-[12px] font-bold text-white/30 tracking-[0.3em] mb-8 relative z-10">Flashcard Answer</span>
                                        <p className="text-xl md:text-2xl font-medium leading-relaxed max-w-2xl relative z-10">
                                            {flashcards[currentCardIndex]?.answer}
                                        </p>
                                        <div className="mt-16 text-white/30 text-[12px] font-bold tracking-widest relative z-10">
                                            Click to see question again
                                        </div>

                                        <div className="absolute bottom-0 left-0 w-full h-2 bg-white/10 overflow-hidden">
                                            <div
                                                className="h-full bg-white transition-all duration-500"
                                                style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full flex items-center justify-center gap-8 mt-12">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentCardIndex(prev => Math.max(0, prev - 1));
                                        setIsFlipped(false);
                                    }}
                                    disabled={currentCardIndex === 0}
                                    className="w-16 h-16 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-[#3B6088] hover:shadow-2xl hover:border-[#3B6088]/20 transition-all disabled:opacity-20 active:scale-90 flex items-center justify-center group"
                                >
                                    <ChevronLeft size={32} className="group-hover:-translate-x-0.5 transition-transform" />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsFlipped(!isFlipped);
                                    }}
                                    className="h-16 px-12 rounded-full bg-white border border-gray-100 text-[#3B6088] font-bold hover:shadow-2xl hover:border-[#3B6088]/20 transition-all active:scale-95 flex items-center gap-3 group"
                                >
                                    <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                                    Flip Card
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (currentCardIndex < flashcards.length - 1) {
                                            setCurrentCardIndex(prev => prev + 1);
                                            setIsFlipped(false);
                                        } else {
                                            alert("Deck complete! Great job!");
                                            setViewMode('generator');
                                        }
                                    }}
                                    className="w-16 h-16 rounded-full bg-[#2C4B64] text-white hover:bg-[#3B6088] hover:shadow-2xl transition-all active:scale-90 flex items-center justify-center group"
                                >
                                    <ChevronRight size={32} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {viewMode === 'history' && (
                        <div className="w-full max-w-[1700px] animate-in fade-in slide-in-from-bottom-5 duration-500 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 md:p-8 lg:p-10 flex flex-col">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#2C4B64]">Generated Flashcards</h2>
                                    <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                                        <Clock size={14} />
                                        Review your generated flashcard collections
                                    </p>
                                </div>

                                <div className="flex flex-col md:flex-row items-center gap-3 flex-1 lg:max-w-3xl">
                                    <div className="relative flex-1 w-full">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3B6088] transition-colors" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search by topic or concept name..."
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#3B6088]/5 focus:border-[#3B6088]/30 focus:bg-white transition-all placeholder:text-gray-400"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="relative min-w-[160px] w-full md:w-auto" ref={historyFilterRef}>
                                        <button
                                            onClick={() => setShowHistoryFilterMenu(!showHistoryFilterMenu)}
                                            className={`w-full flex items-center justify-between gap-3 bg-gray-50/50 border border-gray-200 px-5 py-3 rounded-2xl text-sm font-bold text-[#2C4B64] hover:bg-white hover:border-[#3B6088]/30 transition-all ${showHistoryFilterMenu ? 'border-[#3B6088] bg-white ring-4 ring-[#3B6088]/5' : ''}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Filter size={16} className="text-[#3B6088]" />
                                                <span>{historyFilter}</span>
                                            </div>
                                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${showHistoryFilterMenu ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showHistoryFilterMenu && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                                                {['All', 'Beginner', 'Intermediate', 'Advanced'].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => {
                                                            setHistoryFilter(opt);
                                                            setShowHistoryFilterMenu(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-5 py-2.5 text-left text-sm font-bold transition-all hover:bg-gray-50 ${historyFilter === opt ? 'text-[#3B6088] bg-blue-50/50' : 'text-gray-600'}`}
                                                    >
                                                        {opt}
                                                        {historyFilter === opt && <div className="w-1.5 h-1.5 rounded-full bg-[#3B6088]" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
                                {currentHistoryItems.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handlePracticeDeck(item)}
                                        className="p-7 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 hover:border-[#3B6088]/30 hover:bg-white hover:shadow-2xl hover:shadow-[#2C4B64]/5 transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden active:scale-[0.98]"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold tracking-[0.1em] ${item.difficulty === 'Beginner' ? 'bg-emerald-50 text-emerald-600' :
                                                item.difficulty === 'Intermediate' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                {item.difficulty}
                                            </div>
                                            <div className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-bold">
                                                {item.card_count} Cards
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-start mb-8">
                                            <h3 className="text-xl font-bold text-[#2C4B64] group-hover:text-[#3B6088] transition-colors line-clamp-2 flex-1">{item.topic}</h3>
                                            <p className="text-[11px] text-gray-400 font-medium whitespace-nowrap ml-4 pt-1.5">
                                                {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto pt-5 border-t border-gray-200/50">
                                            <button
                                                onClick={(e) => handleDelete(e, item.id)}
                                                className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <div className="flex items-center gap-2.5 text-[#3B6088] font-bold text-[11px] tracking-[0.1em]">
                                                Practice Now
                                                <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredHistory.length === 0 && (
                                    <div className="col-span-full py-24 text-center">
                                        <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                                            <Layers size={40} className="text-gray-200" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-600">No decks found</h3>
                                        <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">Try adjusting your search or create a new session to see your history.</p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-auto py-8 border-t border-gray-100 flex items-center justify-center gap-2.5">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-3 rounded-2xl border border-gray-200 text-gray-400 hover:text-[#3B6088] hover:border-[#3B6088] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-12 h-12 rounded-2xl text-sm font-bold transition-all active:scale-90 ${currentPage === i + 1
                                                ? 'bg-[#3B6088] text-white shadow-xl shadow-blue-900/10'
                                                : 'text-gray-500 hover:bg-gray-100 hover:text-[#2C4B64]'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-3 rounded-2xl border border-gray-200 text-gray-400 hover:text-[#3B6088] hover:border-[#3B6088] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-gray-100">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <Trash2 className="text-red-500 w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#2C4B64] mb-3">Delete Deck</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-10 px-6">
                                Are you sure you want to permanently remove this flashcard deck?
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-gray-50 text-gray-600 font-bold text-sm hover:bg-gray-100 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/20 transition-all active:scale-95"
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
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white/20 shadow-sm`}>
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

export default Flashcards;
