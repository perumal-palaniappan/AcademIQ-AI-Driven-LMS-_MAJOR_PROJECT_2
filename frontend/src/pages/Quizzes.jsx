import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import Toast from '../components/Toast';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Zap,
    HelpCircle,
    Settings,
    Plus,
    Trash2,
    Edit3,
    ArrowLeft,
    CheckSquare,
    AlertCircle,
    ChevronDown,
    MoreVertical,
    Clock,
    X,
    CheckCircle,
    AlertTriangle,
    List,
    Type,
    Search,
    Award,
    ArrowUpRight,
    LogOut,
    MoreHorizontal
} from 'lucide-react';

const Quizzes = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        fullName: 'Guest User',
        email: '',
        role: 'Student',
        avatar: null
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (e) {
                console.error('Failed to parse user data');
            }
        }
    }, []);

    return (
        <div className="flex min-h-screen bg-[#FDFBF7] font-sans">
            <Sidebar user={user} navigate={navigate} activePage="Quiz" />

            <main className="flex-1 ml-64 p-8">
                {user.role === 'Instructor' ? (
                    <InstructorQuizManager user={user} />
                ) : (
                    <StudentQuizView user={user} />
                )}
            </main>
        </div>
    );
};

/* --- Instructor Quiz Manager --- */

const InstructorQuizManager = ({ user }) => {
    const [view, setView] = useState('dashboard'); // 'dashboard', 'editor'
    const [myQuizzes, setMyQuizzes] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [quizData, setQuizData] = useState({
        id: null,
        title: '',
        explanation: '',
        questions: []
    });

    const [showFilters, setShowFilters] = useState(false);
    const filtersDropdownRef = useRef(null);

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [deleteModal, setDeleteModal] = useState({ show: false, quizId: null });
    const [confirmModal, setConfirmModal] = useState({ show: false, type: '', action: null });
    const [errors, setErrors] = useState({});

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const location = useLocation();

    useEffect(() => {
        if (view === 'dashboard' && user?.id) {
            const timer = setTimeout(() => {
                fetchMyQuizzes(1, activeFilter, searchQuery);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [view, activeFilter, searchQuery, user?.id]);

    useEffect(() => {
        if (location.state?.action === 'create') {
            handleStartCreate();
            // Clear the state so it doesn't trigger again
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filtersDropdownRef.current && !filtersDropdownRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchMyQuizzes = async (page = 1, status = activeFilter, search = searchQuery) => {
        setLoading(true);
        try {
            const limit = 4;
            const offset = (page - 1) * limit;
            const response = await axios.get('/quizzes', {
                params: {
                    instructorId: user.id,
                    status: status === 'all' ? undefined : status,
                    search: search || undefined,
                    limit,
                    offset
                }
            });
            setMyQuizzes(response.data.quizzes);
            setPagination({
                page: response.data.page,
                totalPages: response.data.totalPages,
                total: response.data.total
            });
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartCreate = () => {
        setQuizData({
            id: null,
            title: '',
            explanation: '',
            questions: []
        });
        setErrors({});
        setView('editor');
    };

    const handleEditQuiz = async (quiz, e) => {
        e.stopPropagation();
        try {
            const response = await axios.get(`/quizzes/${quiz.id}`);
            setQuizData(response.data);
            setView('editor');
        } catch (error) {
            console.error('Error loading quiz:', error);
            showToast('Failed to load quiz details', 'error');
        }
    };

    const handleDeleteClick = (id, e) => {
        e.stopPropagation();
        setDeleteModal({ show: true, quizId: id });
    };

    const confirmDeleteQuiz = async () => {
        try {
            await axios.delete(`/quizzes/${deleteModal.quizId}`);
            showToast('Quiz Deleted Successfully', 'success');
            fetchMyQuizzes();
        } catch (error) {
            console.error('Error deleting quiz:', error);
            showToast('Failed to delete quiz', 'error');
        } finally {
            setDeleteModal({ show: false, quizId: null });
        }
    };

    const handlePublish = () => {
        // Validation
        const newErrors = {};
        if (!quizData.title.trim()) newErrors.title = 'Title is required';
        if (!quizData.explanation.trim()) newErrors.explanation = 'Description is required';
        if (quizData.questions.length === 0) newErrors.questions = 'At least one question is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast('Please fix errors before publishing', 'error');
            return;
        }

        setConfirmModal({
            show: true,
            type: 'publish',
            title: quizData.id ? 'Update Quiz' : 'Publish Quiz',
            message: quizData.id ? 'Are you sure you want to update this quiz?' : 'Are you sure you want to publish this quiz?',
            confirmText: quizData.id ? 'Yes, Update' : 'Yes, Publish',
            action: async () => {
                try {
                    let response;
                    if (quizData.id) {
                        response = await axios.put(`/quizzes/${quizData.id}`, quizData);
                    } else {
                        response = await axios.post('/quizzes', quizData);
                    }
                    showToast(quizData.id ? 'Quiz Updated Successfully' : 'Quiz submitted successfully. It will be published after admin approval.', 'success');
                    setView('dashboard');
                } catch (error) {
                    console.error('Error publishing quiz:', error);
                    showToast('Failed to publish quiz', 'error');
                }
            }
        });
    };

    const handleCancel = () => {
        setConfirmModal({
            show: true,
            type: 'cancel',
            title: 'Discard Changes',
            message: 'All unsaved changes will be lost. Are you sure you want to cancel?',
            action: () => setView('dashboard')
        });
    };

    const addQuestion = (type) => {
        const newQuestion = {
            id: Date.now(),
            question_text: '',
            question_type: type, // 'multiple_choice' or 'checkbox'
            options: [
                { id: Date.now() + 1, option_text: '', is_correct: false },
                { id: Date.now() + 2, option_text: '', is_correct: false }
            ]
        };
        setQuizData(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));
    };

    const updateQuestionText = (qId, text) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.map(q => q.id === qId ? { ...q, question_text: text } : q)
        }));
    };

    const removeQuestion = (qId) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== qId)
        }));
    };

    const addOption = (qId) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.map(q => {
                if (q.id === qId) {
                    return {
                        ...q,
                        options: [...q.options, { id: Date.now(), option_text: '', is_correct: false }]
                    };
                }
                return q;
            })
        }));
    };

    const updateOptionText = (qId, oId, text) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.map(q => {
                if (q.id === qId) {
                    return {
                        ...q,
                        options: q.options.map(o => o.id === oId ? { ...o, option_text: text } : o)
                    };
                }
                return q;
            })
        }));
    };

    const toggleOptionCorrect = (qId, oId) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.map(q => {
                if (q.id === qId) {
                    if (q.question_type === 'multiple_choice') {
                        // Only one correct for multiple choice
                        return {
                            ...q,
                            options: q.options.map(o => ({
                                ...o,
                                is_correct: o.id === oId
                            }))
                        };
                    } else {
                        // Multiple correct for checkbox
                        return {
                            ...q,
                            options: q.options.map(o => o.id === oId ? { ...o, is_correct: !o.is_correct } : o)
                        };
                    }
                }
                return q;
            })
        }));
    };

    const removeOption = (qId, oId) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.map(q => {
                if (q.id === qId && q.options.length > 2) {
                    return {
                        ...q,
                        options: q.options.filter(o => o.id !== oId)
                    };
                }
                return q;
            })
        }));
    };

    if (view === 'editor') {
        return (
            <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
                    <div>
                        <div className="flex items-center gap-2 text-[#3B6088] font-bold text-xs uppercase tracking-wider mb-2">
                            <Zap size={14} />
                            Quiz Creator
                        </div>
                        <h2 className="text-2xl font-bold text-[#2C4B64]">
                            {quizData.id ? 'Edit Quiz' : 'Create New Quiz'}
                        </h2>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Quiz Title</label>
                            <input
                                type="text"
                                className={`w-full px-4 py-3 bg-gray-50 border ${errors.title ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#3B6088] outline-none transition-all`}
                                placeholder="e.g. Introduction to React Fundamentals"
                                value={quizData.title}
                                onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                            />
                            {errors.title && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.title}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Instructions / Explanation</label>
                            <textarea
                                className={`w-full px-4 py-3 bg-gray-50 border ${errors.explanation ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-[#3B6088] outline-none transition-all h-32 resize-none`}
                                placeholder="Explain what this quiz covers and provide any instructions for the students..."
                                value={quizData.explanation}
                                onChange={(e) => setQuizData({ ...quizData, explanation: e.target.value })}
                            ></textarea>
                            {errors.explanation && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.explanation}</p>}
                        </div>
                    </div>

                    {/* Questions Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-[#2C4B64] flex items-center gap-2">
                                <List size={22} className="text-[#3B6088]" />
                                Quiz Questions
                            </h3>
                            {errors.questions && <span className="text-red-500 text-sm font-medium">{errors.questions}</span>}
                        </div>

                        {quizData.questions.map((q, qIdx) => (
                            <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
                                <div className="bg-[#3B6088] p-4 flex justify-between items-center text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                                            {qIdx + 1}
                                        </div>
                                        <span className="font-semibold text-sm">
                                            {q.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Checkbox (Multiple Answers)'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeQuestion(q.id)}
                                        className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                        title="Delete Question"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <input
                                            type="text"
                                            className="w-full text-lg font-bold text-gray-800 bg-transparent border-b border-gray-200 focus:border-[#3B6088] focus:outline-none pb-2 placeholder-gray-300"
                                            placeholder="Type your question here..."
                                            value={q.question_text}
                                            onChange={(e) => updateQuestionText(q.id, e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Options</p>
                                        {q.options.map((opt, oIdx) => (
                                            <div key={opt.id} className="flex items-center gap-3 group">
                                                <button
                                                    onClick={() => toggleOptionCorrect(q.id, opt.id)}
                                                    className={`w-6 h-6 rounded flex items-center justify-center transition-all ${opt.is_correct ? 'bg-green-500 border-green-500 shadow-sm' : 'bg-gray-50 border border-gray-200'}`}
                                                >
                                                    {opt.is_correct && <CheckSquare size={14} className="text-white" />}
                                                </button>
                                                <input
                                                    type="text"
                                                    className="flex-1 bg-gray-50 border border-transparent rounded-lg px-4 py-2 text-sm focus:bg-white focus:border-gray-200 outline-none transition-all"
                                                    placeholder={`Choice ${oIdx + 1}`}
                                                    value={opt.option_text}
                                                    onChange={(e) => updateOptionText(q.id, opt.id, e.target.value)}
                                                />
                                                <button
                                                    onClick={() => removeOption(q.id, opt.id)}
                                                    className={`p-2 text-gray-300 hover:text-red-500 transition-colors ${q.options.length <= 2 ? 'invisible' : ''}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addOption(q.id)}
                                            className="mt-2 text-sm font-bold text-[#3B6088] hover:text-[#2C4B64] transition-colors flex items-center gap-1 pl-9"
                                        >
                                            <Plus size={16} /> Add another choice
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => addQuestion('multiple_choice')}
                                className="p-4 border-2 bg-[#FFF] border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-[#3B6088] hover:bg-blue-50/30 hover:text-[#3B6088] font-bold transition-all flex flex-col items-center gap-2"
                            >
                                <Type size={24} />
                                <span>+ Multiple Choice</span>
                            </button>
                            <button
                                onClick={() => addQuestion('checkbox')}
                                className="p-4 border-2 bg-[#FFF] border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-[#3B6088] hover:bg-blue-50/30 hover:text-[#3B6088] font-bold transition-all flex flex-col items-center gap-2"
                            >
                                <CheckSquare size={24} />
                                <span>+ Checkboxes</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-12 pt-8 border-t border-gray-100 flex justify-end gap-4">
                    <button
                        onClick={handleCancel}
                        className="px-8 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePublish}
                        className="px-10 py-3 rounded-xl bg-[#3B6088] text-white font-bold hover:bg-[#2C4B64] shadow-lg shadow-blue-900/10 transition-all active:scale-95"
                    >
                        {quizData.id ? 'Update Quiz' : 'Publish Quiz'}
                    </button>
                </div>

                {confirmModal.show && (
                    <ConfirmModal
                        title={confirmModal.title}
                        message={confirmModal.message}
                        confirmText={confirmModal.confirmText}
                        onConfirm={() => {
                            confirmModal.action();
                            setConfirmModal({ ...confirmModal, show: false });
                        }}
                        onCancel={() => setConfirmModal({ ...confirmModal, show: false })}
                        type={confirmModal.type}
                    />
                )}
                {toast.show && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast({ ...toast, show: false })}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-[#2C4B64]">My Quizzes</h1>
                    <p className="text-gray-500 text-sm mt-1">Create engaging assessments to test your students' knowledge.</p>
                </div>
                <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                    <button
                        onClick={handleStartCreate}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#3B6088] text-white rounded-xl font-bold hover:bg-[#2C4B64] transition-all shadow-lg shadow-blue-900/20"
                    >
                        <Plus size={20} />
                        Create New Quiz
                    </button>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* Filter Dropdown */}
                        <div className="relative" ref={filtersDropdownRef}>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-5 py-2.5 bg-white border ${showFilters ? 'border-[#3B6088] ring-4 ring-[#3B6088]/10' : 'border-gray-200'} rounded-xl text-xs font-bold transition-all shadow-sm hover:border-gray-300 group`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${activeFilter === 'all' ? 'bg-[#3B6088]' :
                                        activeFilter === 'accepted' ? 'bg-green-500' :
                                            activeFilter === 'rejected' ? 'bg-red-500' : 'bg-orange-500'
                                        }`}></div>
                                    <span className="text-[#2C4B64] tracking-wider">
                                        Status: {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                                    </span>
                                </div>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${showFilters ? 'rotate-180 text-[#3B6088]' : 'group-hover:text-gray-600'}`} />
                            </button>

                            {showFilters && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
                                    {[
                                        { id: 'all', label: 'All Quizzes', color: 'bg-[#3B6088]' },
                                        { id: 'pending', label: 'Pending', color: 'bg-orange-500' },
                                        { id: 'accepted', label: 'Accepted', color: 'bg-green-500' },
                                        { id: 'rejected', label: 'Rejected', color: 'bg-red-500' }
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setActiveFilter(option.id);
                                                setPagination(prev => ({ ...prev, page: 1 }));
                                                setShowFilters(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${activeFilter === option.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${option.color}`}></div>
                                                <span className={`text-[11px] font-bold ${activeFilter === option.id ? 'text-[#3B6088]' : 'text-gray-600 tracking-tight'}`}>
                                                    {option.label}
                                                </span>
                                            </div>
                                            {activeFilter === option.id && <CheckCircle size={12} className="text-[#3B6088]" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Search Bar */}
                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#3B6088] transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search quiz name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3B6088]/20 focus:border-[#3B6088] transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-8">
                {myQuizzes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {myQuizzes.map((quiz) => (
                            <div key={quiz.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${quiz.status === 'accepted' ? 'bg-green-50 text-green-600' : quiz.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {(quiz.status || 'pending').charAt(0).toUpperCase() + (quiz.status || 'pending').slice(1)}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleEditQuiz(quiz, e)}
                                                className="p-2 text-gray-400 hover:text-[#3B6088] hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(quiz.id, e)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">{quiz.title}</h3>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">{quiz.explanation}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                                            <List size={14} />
                                            <span>{quiz.questions_count} Questions</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                                            <Clock size={14} />
                                            <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-[#3B6088] mb-6 animate-bounce">
                            <HelpCircle size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-[#2C4B64] mb-2">No Quizzes Found</h2>
                        <p className="text-gray-500 text-sm mt-1">No quizzes are available in this status.</p>
                    </div>
                )}

                {/* Pagination - Matching Courses Style */}
                {pagination.total > 4 && (
                    <div className="flex items-center justify-between mt-4 pt-6 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 tracking-wider">
                            Showing <span className="text-gray-900">{(pagination.page - 1) * 4 + 1}</span> to <span className="text-gray-900">{Math.min(pagination.page * 4, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> quizzes
                        </p>
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                            <button
                                onClick={() => fetchMyQuizzes(Math.max(1, pagination.page - 1))}
                                disabled={pagination.page === 1}
                                className={`p-2 rounded-lg transition-all ${pagination.page === 1 ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                            >
                                <ArrowLeft size={18} strokeWidth={2.5} />
                            </button>

                            <div className="flex items-center gap-1 px-2 overflow-x-auto max-w-[200px] no-scrollbar">
                                {Array.from({ length: pagination.totalPages }).map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => fetchMyQuizzes(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pagination.page === i + 1
                                            ? 'bg-[#3B6088] text-white shadow-md'
                                            : 'text-gray-500 hover:bg-gray-100'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => fetchMyQuizzes(Math.min(pagination.totalPages, pagination.page + 1))}
                                disabled={pagination.page === pagination.totalPages}
                                className={`p-2 rounded-lg transition-all ${pagination.page === pagination.totalPages ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                            >
                                <ChevronDown className="-rotate-90" size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {deleteModal.show && (
                <ConfirmModal
                    title="Delete Quiz"
                    message="Are you sure you want to permanently delete this quiz?"
                    onConfirm={confirmDeleteQuiz}
                    onCancel={() => setDeleteModal({ show: false, quizId: null })}
                    type="delete"
                />
            )}

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

/* --- Student Components --- */

const StudentQuizView = ({ user }) => {
    const [view, setView] = useState('catalog'); // 'catalog', 'player', 'result', 'my_results'
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pending', 'completed'
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

    const fetchQuizzes = async (page = 1, filter = activeFilter, search = searchQuery) => {
        setLoading(true);
        try {
            const limit = 6;
            const offset = (page - 1) * limit;
            const response = await axios.get(`/student/quizzes`, {
                params: {
                    userId: user.id,
                    limit,
                    offset,
                    filter,
                    search
                }
            });
            setQuizzes(response.data.quizzes);
            setPagination({
                page: response.data.page,
                total: response.data.total,
                totalPages: response.data.totalPages
            });
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'catalog') {
            const timer = setTimeout(() => {
                fetchQuizzes(1, activeFilter, searchQuery);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [view, activeFilter, searchQuery, user.id]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchQuizzes(newPage, activeFilter, searchQuery);
        }
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleTakeQuiz = async (quizId) => {
        try {
            const response = await axios.get(`/quizzes/${quizId}`);
            setActiveQuiz(response.data);
            setView('player');
        } catch (error) {
            console.error('Error loading quiz details:', error);
        }
    };

    const handleQuizComplete = (result) => {
        setLastResult(result);
        setView('result');
    };

    if (view === 'player') {
        return (
            <StudentQuizPlayer
                quiz={activeQuiz}
                user={user}
                onComplete={handleQuizComplete}
                onCancel={() => setView('catalog')}
            />
        );
    }

    if (view === 'result') {
        return (
            <StudentQuizResult
                result={lastResult}
                quiz={activeQuiz}
                onRetry={() => setView('player')}
                onBack={() => setView('catalog')}
            />
        );
    }

    if (view === 'my_results') {
        return (
            <StudentQuizAttempts
                user={user}
                onBack={() => setView('catalog')}
            />
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[#2C4B64]">Explore Quizzes</h1>
                        <p className="text-gray-500 text-sm mt-1">Test your knowledge and track your progress across different subjects.</p>
                    </div>

                    <button
                        onClick={() => setView('my_results')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#3B6088] text-[#3B6088] rounded-xl font-bold hover:bg-blue-50 transition-all shadow-md active:scale-95 shrink-0"
                    >
                        <Award size={18} />
                        My Results
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-8">
                    {/* All Quizzes Title and Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-bold text-[#2C4B64]">All Quizzes</h2>

                        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                            {/* Filter Buttons */}
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                {['all', 'pending', 'completed'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => handleFilterChange(filter)}
                                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeFilter === filter
                                            ? 'bg-white text-[#3B6088] shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Search Bar */}
                            <div className="relative group w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#3B6088] transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search quizzes or instructors..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 bg-white py-2 bg-[#FDFBF7] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6088]/20 focus:border-[#3B6088] transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20 min-h-[400px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B6088] self-center"></div>
                        </div>
                    ) : quizzes.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {quizzes.map((quiz) => (
                                    <div key={quiz.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-lg transition-all duration-300 group">
                                        <div className="h-40 relative bg-[#3B6088]/5 overflow-hidden flex flex-col items-center justify-center gap-3">
                                            <div className="text-center">
                                                <div className={`text-[10px] font-bold uppercase tracking-widest ${quiz.is_completed ? 'text-green-500' : 'text-[#3B6088]'}`}>
                                                    {quiz.is_completed ? 'Quiz Completed' : 'New Assessment'}
                                                </div>
                                            </div>

                                            {/* Centered Instructor Badge */}
                                            <div className="flex items-center gap-2 pr-4 py-1.5 pl-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/40 shadow-sm transition-all group-hover:bg-white group-hover:shadow-md">
                                                <div className="w-8 h-8 rounded-full bg-[#2C4B64] flex items-center justify-center text-xs text-white font-bold">
                                                    {quiz.instructor_name ? quiz.instructor_name.charAt(0) : 'I'}
                                                </div>
                                                <span className="text-xs font-bold text-[#2C4B64] tracking-wide">
                                                    {quiz.instructor_name || 'Instructor'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="font-bold text-lg text-[#2C4B64] mb-2 line-clamp-1" title={quiz.title}>{quiz.title}</h3>
                                            <p className="text-gray-500 text-xs mb-4 line-clamp-3 flex-1">{quiz.explanation || 'No instructions provided.'}</p>

                                            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                                                <div className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                                                    <List size={14} />
                                                    {quiz.questions_count || 0} Questions
                                                </div>
                                                <button
                                                    onClick={() => handleTakeQuiz(quiz.id)}
                                                    className={`px-6 py-2 ${quiz.is_completed ? 'bg-green-500 hover:bg-green-600' : 'bg-[#3B6088] hover:bg-[#2C4B64]'} text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95`}
                                                >
                                                    {quiz.is_completed ? 'Retake Quiz' : 'Take Quiz'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.total > 6 && (
                                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                                    <p className="text-xs font-semibold text-gray-500 tracking-wider">
                                        Showing <span className="text-gray-900">{(pagination.page - 1) * 6 + 1}</span> to <span className="text-gray-900">{Math.min(pagination.page * 6, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> quizzes
                                    </p>
                                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                        <button
                                            onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                                            disabled={pagination.page === 1}
                                            className={`p-2 rounded-lg transition-all ${pagination.page === 1 ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                                        >
                                            <ArrowLeft size={18} strokeWidth={2.5} />
                                        </button>

                                        <div className="flex items-center gap-1 px-2">
                                            {Array.from({ length: pagination.totalPages }).map((_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => handlePageChange(i + 1)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pagination.page === i + 1
                                                        ? 'bg-[#3B6088] text-white shadow-md'
                                                        : 'text-gray-500 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                                            disabled={pagination.page === pagination.totalPages}
                                            className={`p-2 rounded-lg transition-all ${pagination.page === pagination.totalPages ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                                        >
                                            <ChevronDown className="-rotate-90" size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 bg-[#FDFBF7] rounded-2xl border border-gray-100 border-dashed">
                            <div className="w-20 h-20 bg-blue-50/50 rounded-full flex items-center justify-center text-[#3B6088]/30 mb-6">
                                <HelpCircle size={40} />
                            </div>
                            <h2 className="text-xl font-bold text-[#2C4B64] mb-2">No Quizzes Found</h2>
                            <p className="text-gray-400 text-sm max-w-xs text-center">We couldn't find any {activeFilter === 'completed' ? 'completed' : 'pending'} quizzes at the moment.</p>
                            <button
                                onClick={() => handleFilterChange(activeFilter === 'completed' ? 'pending' : 'completed')}
                                className="mt-6 text-[#3B6088] font-bold text-sm hover:underline"
                            >
                                View {activeFilter === 'completed' ? 'pending' : 'completed'} quizzes instead
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* --- My Results View --- */
const StudentQuizAttempts = ({ user, onBack }) => {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttempts = async () => {
            try {
                const response = await axios.get(`/quizzes/attempts/${user.id}`);
                setAttempts(response.data);
            } catch (err) {
                console.error("Error fetching attempts:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttempts();
    }, [user.id]);

    return (
        <div className="animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[#2C4B64]">My Quiz Results</h1>
                    <p className="text-gray-500 text-sm mt-1">Track your performance across all attempted assessments.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B6088]"></div>
                </div>
            ) : attempts.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400  tracking-wider">Quiz Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400  tracking-wider text-center">Score</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400  tracking-wider text-center">Percentage</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400  tracking-wider text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {attempts.map((attempt) => (
                                <tr key={attempt.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-[#2C4B64]">{attempt.quiz_title}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="text-sm font-bold text-gray-700">{attempt.score} / {attempt.total_questions}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="flex-1 max-w-[100px] bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${parseFloat(attempt.percentage) >= 70 ? 'bg-green-500' : parseFloat(attempt.percentage) >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                                                    style={{ width: `${attempt.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className={`text-sm font-bold ${parseFloat(attempt.percentage) >= 70 ? 'text-green-600' : parseFloat(attempt.percentage) >= 40 ? 'text-orange-600' : 'text-red-600'}`}>
                                                {parseFloat(attempt.percentage).toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-xs text-gray-500 font-medium">
                                            {new Date(attempt.attempted_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 border-dashed">
                    <Award size={48} className="text-gray-200 mb-4" />
                    <p className="text-gray-500 font-medium text-lg">You haven't taken any quizzes yet.</p>
                    <button
                        onClick={onBack}
                        className="mt-4 px-6 py-2 bg-[#3B6088] text-white rounded-xl font-bold hover:bg-[#2C4B64] transition-all"
                    >
                        Browse Quizzes
                    </button>
                </div>
            )}
        </div>
    );
};

const StudentQuizPlayer = ({ quiz, user, onComplete, onCancel }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: [selectedOptionIds] }
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes default
    const [showExitModal, setShowExitModal] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

    const handleOptionSelect = (optionId) => {
        const qId = currentQuestion.id;
        const type = currentQuestion.question_type;

        if (type === 'multiple_choice') {
            setAnswers(prev => ({ ...prev, [qId]: [optionId] }));
        } else {
            const currentAnswers = answers[qId] || [];
            if (currentAnswers.includes(optionId)) {
                setAnswers(prev => ({ ...prev, [qId]: currentAnswers.filter(id => id !== optionId) }));
            } else {
                setAnswers(prev => ({ ...prev, [qId]: [...currentAnswers, optionId] }));
            }
        }
    };

    const handleSubmit = async () => {
        let score = 0;
        let correctCount = 0;
        let wrongCount = 0;

        const results = quiz.questions.map(q => {
            const userAns = answers[q.id] || [];
            const correctAns = q.options.filter(o => o.is_correct).map(o => o.id);

            const isCorrect = userAns.length === correctAns.length &&
                userAns.every(id => correctAns.includes(id));

            if (isCorrect) correctCount++;
            else wrongCount++;

            return {
                questionId: q.id,
                isCorrect,
                userAnswers: userAns,
                correctAnswers: correctAns
            };
        });

        score = correctCount;
        const percentage = (score / quiz.questions.length) * 100;

        try {
            await axios.post('/quizzes/attempts', {
                quiz_id: quiz.id,
                score,
                total_questions: quiz.questions.length,
                correct_answers: correctCount,
                wrong_answers: wrongCount
            });
        } catch (error) {
            console.error('Failed to save quiz attempt:', error);
        }

        onComplete({
            score,
            total: quiz.questions.length,
            percentage,
            correctCount,
            wrongCount,
            results
        });
    };

    const progressPercentage = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Exit Confirmation Modal */}
            {showExitModal && (
                <ConfirmModal
                    title="Exit Quiz?"
                    message="Are you sure you want to leave? Your current progress will not be saved and you'll have to start over."
                    onConfirm={onCancel}
                    onCancel={() => setShowExitModal(false)}
                    type="warning"
                    confirmText="Yes, Exit Quiz"
                />
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowExitModal(true)}
                        className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[#3B6088] hover:border-[#3B6088] transition-all shadow-sm active:scale-90"
                        title="Go back to library"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-2xl font-bold text-[#2C4B64]">{quiz.title}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Quiz Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden relative">
                        {/* Progress Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gray-50 font-bold">
                            <div
                                className="h-full bg-[#3B6088] transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>

                        <div className="p-10">
                            <div className="flex justify-between items-center mb-10">
                                <span className="bg-blue-50 text-[#3B6088] px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest border border-blue-100">
                                    Question {currentQuestionIndex + 1} of {quiz.questions.length}
                                </span>
                            </div>

                            <h2 className="text-xl font-bold text-[#2C4B64] mb-10 leading-tight">
                                {currentQuestion.question_text}
                            </h2>

                            <div className="space-y-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const letter = String.fromCharCode(65 + idx);
                                    const isSelected = (answers[currentQuestion.id] || []).includes(option.id);

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => handleOptionSelect(option.id)}
                                            className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-200 group ${isSelected
                                                ? 'border-[#3B6088] bg-blue-50/30'
                                                : 'border-gray-50 bg-[#F9FAFB] hover:border-gray-200 hover:bg-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all ${isSelected
                                                    ? 'bg-[#3B6088] border-[#3B6088] text-white font-semibold'
                                                    : 'border-gray-200 text-gray-400 group-hover:border-gray-300'
                                                    }`}>
                                                    {isSelected ? <CheckSquare size={14} /> : letter}
                                                </div>
                                                <span className={`font-semibold transition-colors ${isSelected ? 'text-[#3B6088]' : 'text-gray-600'}`}>
                                                    {option.option_text}
                                                </span>
                                            </div>
                                            <div className={`text-[10px] font-bold transition-colors ${isSelected ? 'text-[#3B6088]' : 'text-gray-300'}`}>
                                                {letter}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center px-4">
                        <button
                            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                            disabled={currentQuestionIndex === 0}
                            className={`flex items-center gap-2 font-bold transition-all ${currentQuestionIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-[#2C4B64]'
                                }`}
                        >
                            <ArrowLeft size={20} />
                            Previous
                        </button>

                        {isLastQuestion ? (
                            <button
                                onClick={handleSubmit}
                                className="px-10 py-4 bg-[#3B6088] text-white rounded-2xl font-bold hover:bg-[#2C4B64] shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                                Submit Quiz
                                <CheckCircle size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                                className="px-10 py-4 bg-[#3B6088] text-white rounded-2xl font-bold hover:bg-[#2C4B64] shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                                Next Question
                                <ArrowLeft size={20} className="rotate-180" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-lg font-bold">
                        <h3 className="text-lg font-bold text-[#2C4B64] mb-6">Quiz Progress</h3>
                        <div className="flex justify-between items-center text-xs text-gray-400 mb-4 font-bold">
                            <span>Completed</span>
                            <span className="text-[#3B6088]">{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-50 rounded-full h-2.5 mb-8">
                            <div className="bg-[#3B6088] h-2.5 rounded-full shadow-sm" style={{ width: `${progressPercentage}%` }}></div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {quiz.questions.map((_, idx) => {
                                const isAnswered = answers[quiz.questions[idx].id]?.length > 0;
                                const isCurrent = currentQuestionIndex === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        className={`w-full aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all ${isCurrent
                                            ? 'bg-[#3B6088] text-white ring-4 ring-blue-100 shadow-lg font-bold'
                                            : isAnswered
                                                ? 'bg-green-100 text-green-600 border border-green-200 font-bold'
                                                : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-gray-200 font-bold'
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex flex-wrap gap-4 pl-1">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-100 border border-green-200"></div>
                                <span className="text-[10px] text-gray-400 tracking-widest font-bold">Solved</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#3B6088]"></div>
                                <span className="text-[10px] text-gray-400 tracking-widest font-bold">Current</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-gray-100"></div>
                                <span className="text-[10px] text-gray-400 tracking-widest font-bold">Remaining</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#FAF7F2] rounded-[2rem] p-8 border border-orange-100/50 relative overflow-hidden font-bold h-fit min-h-[200px]">
                        <div className="absolute top-4 right-4 text-orange-200/40">
                            <FileText size={48} />
                        </div>
                        <h4 className="text-lg font-bold text-[#2C4B64] mb-4 relative z-10">Topic Description</h4>
                        <p className="text-sm text-gray-500 font-semibold leading-relaxed mb-6 relative z-10 line-clamp-[8]">
                            {quiz.explanation || 'No description available for this quiz.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StudentQuizResult = ({ result, quiz, onRetry, onBack }) => {
    const isPassed = result.percentage >= 60;

    return (
        <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200 border border-gray-100 overflow-hidden font-bold">
                {/* Result Header */}
                <div className={`p-12 text-center relative ${isPassed ? 'bg-green-50' : 'bg-red-50'}`}>

                    <div className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center border-8 ${isPassed ? 'bg-white border-green-500 text-green-600' : 'bg-white border-red-500 text-red-600 shadow-red-100/10'} shadow-2xl`}>
                        <div className="text-center">
                            <span className="text-4xl font-black block leading-tight">{Math.round(result.percentage)}%</span>
                        </div>
                    </div>

                    <h1 className={`text-3xl font-black mb-2 ${isPassed ? 'text-green-700' : 'text-red-700'}`}>
                        {isPassed ? 'Fantastic Work!' : 'Keep Practicing!'}
                    </h1>
                    <p className="text-gray-500 text-lg font-semibold">You completed the {quiz.title}</p>
                </div>

                <div className="p-12">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-blue-50/30 p-8 rounded-[2rem] border border-blue-50 text-center">
                            <p className="text-[10px] text-gray-500 font-bold  tracking-[0.2em] mb-2">Total Score</p>
                            <h4 className="text-2xl font-black text-[#2C4B64]">{result.score} / {result.total}</h4>
                        </div>
                        <div className="bg-green-50/20 p-8 rounded-[2rem] border border-green-50 text-center">
                            <p className="text-[10px] text-gray-500 font-bold  tracking-[0.2em] mb-2">Right Answers</p>
                            <h4 className="text-2xl font-black text-green-600">{result.correctCount}</h4>
                        </div>
                        <div className="bg-red-50/20 p-8 rounded-[2rem] border border-red-50 text-center">
                            <p className="text-[10px] text-gray-500 font-bold  tracking-[0.2em] mb-2">Wrong Answers</p>
                            <h4 className="text-2xl font-black text-red-500">{result.wrongCount}</h4>
                        </div>
                    </div>

                    {/* Review Section */}
                    <div className="space-y-6 mb-12">
                        <h3 className="text-xl font-bold text-[#2C4B64] flex items-center gap-2 mb-6">
                            <List size={24} className="text-[#3B6088]" />
                            Review Answer Sheets
                        </h3>

                        {quiz.questions.map((q, idx) => {
                            const res = result.results.find(r => r.questionId === q.id);
                            return (
                                <div key={q.id} className={`p-6 rounded-3xl border-2 ${res.isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${res.isCorrect ? 'bg-green-500 text-white shadow-sm shadow-green-200' : 'bg-red-500 text-white shadow-sm shadow-red-200'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[#2C4B64] mb-4 text-lg">{q.question_text}</h4>

                                            <div className="space-y-2">
                                                {q.options.map(opt => {
                                                    const isUserChosen = res.userAnswers.includes(opt.id);
                                                    const isCorrect = opt.is_correct;

                                                    return (
                                                        <div key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${isCorrect
                                                            ? 'bg-green-50 border-green-200 text-green-700 font-bold shadow-sm'
                                                            : isUserChosen
                                                                ? 'bg-red-50 border-red-200 text-red-700 font-bold shadow-sm'
                                                                : 'bg-white border-gray-100 text-gray-500'
                                                            }`}>
                                                            <span>{opt.option_text}</span>
                                                            <div className="flex gap-2">
                                                                {isUserChosen && <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-current bg-opacity-10 border border-current shadow-sm shadow-black/5">Your Answer</span>}
                                                                {isCorrect && !isUserChosen && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-500 text-white shadow-sm shadow-green-200">Correct Answer</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-12 border-t border-gray-100">
                        <button
                            onClick={onBack}
                            className="flex-1 py-4.5 bg-gray-50 text-[#2C4B64] rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg shadow-sm font-bold"
                        >
                            <ArrowLeft size={20} />
                            Back to Library
                        </button>
                        <button
                            onClick={onRetry}
                            className="flex-1 py-4.5 bg-[#3B6088] text-white rounded-2xl font-bold hover:bg-[#2C4B64] shadow-2xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg font-bold"
                        >
                            <Zap size={20} />
                            Retry Quiz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* --- Common Components --- */

const Sidebar = ({ user, navigate, activePage }) => {
    const [showSidebarProfileMenu, setShowSidebarProfileMenu] = useState(false);
    const sidebarProfileRef = useRef(null);

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

    return (
        <aside className="w-64 bg-[#2C4B64] text-white flex flex-col fixed h-full transition-all duration-300 z-20">
            <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">AcademIQ</span>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => navigate('/dashboard')} active={activePage === 'Dashboard'} />
                <SidebarItem icon={<BookOpen size={20} />} label="Courses" active={activePage === 'Courses'} onClick={() => navigate('/courses')} />
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
    useEffect(() => { setImgError(false); }, [user.avatar]);

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
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden`}>
                <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" onError={() => setImgError(true)} />
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

const ConfirmModal = ({ title, message, onConfirm, onCancel, type, confirmText }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <div className={`flex items-center gap-3 mb-4 ${type === 'delete' ? 'text-red-600' : 'text-[#3B6088]'}`}>
                {type === 'delete' ? <Trash2 size={24} /> : type === 'publish' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                <h3 className="text-xl font-bold">{title}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                {message}
            </p>
            <div className="flex gap-3 justify-end">
                <button
                    onClick={onCancel}
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 ${type === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-red-900/10' : 'bg-[#3B6088] hover:bg-[#2C4B64] shadow-blue-900/10'}`}
                >
                    {confirmText || (type === 'delete' ? 'Yes, Delete' : type === 'publish' ? 'Yes, Publish' : 'Confirm')}
                </button>
            </div>
        </div>
    </div>
);

export default Quizzes;
