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
    Bell,
    Monitor,
    ChevronDown,
    AlertTriangle,
    AlertCircle,
    PlayCircle,
    Award,
    Plus,
    Save,
    ArrowLeft,
    CheckSquare,
    Type,
    List,
    MoreHorizontal,
    MoreVertical,
    Trash2,
    Edit3,
    CheckCircle,
    Image,
    Undo,
    Redo,
    TrendingUp,
    Clock,
    ArrowUpRight,
    LogOut,
    Search,
    Filter
} from 'lucide-react';

const Courses = () => {
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
            <Sidebar user={user} navigate={navigate} activePage="Courses" />

            <main className="flex-1 ml-64 p-8">
                {user.role === 'Instructor' ? (
                    <InstructorCourseManager user={user} />
                ) : (
                    <StudentCourseView user={user} />
                )}
            </main>
        </div>
    );
};

/* --- Instructor Components --- */

const InstructorCourseManager = ({ user }) => {
    const [view, setView] = useState('dashboard'); // 'dashboard', 'builder', 'concept_editor'
    const [myCourses, setMyCourses] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const filtersDropdownRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [courseData, setCourseData] = useState({
        id: null,
        title: '',
        objective: '',
        bannerImage: null,
        modules: [],
        learnerAdvantages: {
            notes: false,
            certification: false,
            certificationFile: null
        }
    });

    const fileInputRef = useRef(null);
    const certificateInputRef = useRef(null);

    // Temp state for the concept currently being edited
    const [activeModuleId, setActiveModuleId] = useState(null);
    const [activeConcept, setActiveConcept] = useState({ id: null, name: '', explanation: '' });

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const [deleteModal, setDeleteModal] = useState({ show: false, courseId: null });
    const [cancelModal, setCancelModal] = useState(false);
    const [inputModal, setInputModal] = useState({ isOpen: false, type: '', value: '', targetId: null, title: '' });
    const [errors, setErrors] = useState({});

    // Undo/Redo History State
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const addToHistory = (newState) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            // Limit history size if needed, but for now open
            newHistory.push(newState);
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setCourseData(history[newIndex]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setCourseData(history[newIndex]);
        }
    };

    const handleCancel = () => {
        setCancelModal(true);
    };

    const confirmCancel = () => {
        setView('dashboard');
        setHistory([]);
        setHistoryIndex(-1);
        setCancelModal(false);
    };

    const location = useLocation();

    useEffect(() => {
        if (view === 'dashboard' && user?.id) {
            const timer = setTimeout(() => {
                fetchMyCourses(1, activeFilter, searchQuery);
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

    const fetchMyCourses = async (page = 1, status = activeFilter, search = searchQuery) => {
        setLoading(true);
        try {
            const limit = 6;
            const offset = (page - 1) * limit;
            const response = await axios.get('/courses', {
                params: {
                    instructorId: user.id,
                    status: status === 'all' ? undefined : status,
                    search: search || undefined,
                    limit,
                    offset
                }
            });
            setMyCourses(response.data.courses);
            setPagination({
                page: response.data.page,
                totalPages: response.data.totalPages,
                total: response.data.total
            });
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('data:')) return imagePath; // Base64
        if (imagePath.startsWith('http')) return imagePath; // External URL
        return `http://localhost:5000${imagePath}`; // Backend local file
    };

    const handleStartCreate = () => {
        const initialData = {
            id: null,
            title: '',
            objective: '',
            bannerImage: null,
            modules: [],
            learnerAdvantages: { notes: false, certification: false, certificationFile: null }
        };
        setCourseData(initialData);
        setHistory([initialData]);
        setHistoryIndex(0);
        setView('builder');
    };

    const handleUpdateCourse = (field, value) => {
        setCourseData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newCourseData = { ...courseData, bannerImage: reader.result };
                setCourseData(newCourseData);
                addToHistory(newCourseData);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCertificateChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newData = {
                    ...courseData,
                    learnerAdvantages: {
                        ...courseData.learnerAdvantages,
                        certificationFile: reader.result
                    }
                };
                setCourseData(newData);
                addToHistory(newData);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePublish = async () => {
        try {
            // Basic validation
            const newErrors = {};
            if (!courseData.title.trim()) newErrors.title = 'Course title is required';
            if (!courseData.objective.trim()) newErrors.objective = 'Course objective is required';
            if (courseData.modules.length === 0) newErrors.modules = 'At least one module is required';

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                showToast('Please fix the errors before publishing', 'error');
                return;
            }

            let response;
            if (courseData.id) {
                // Update
                response = await axios.put(`/courses/${courseData.id}`, courseData);
            } else {
                // Create
                response = await axios.post('/courses', courseData);
            }

            if (response.status === 201 || response.status === 200) {
                showToast(courseData.id ? 'Course Updated Successfully' : 'Course submitted successfully. It will be published after admin approval.', 'success');
                setView('dashboard');
                // Reset handled by handleStartCreate or initial state, but explicit reset good too
                setCourseData({
                    id: null,
                    title: '',
                    objective: '',
                    bannerImage: null,
                    modules: [],
                    learnerAdvantages: { notes: false, certification: false }
                });
            }
        } catch (error) {
            console.error('Error publishing course:', error);
            showToast('Failed to publish course. See console for details.', 'error');
        }
    };

    const handleDeleteCourse = async (id, e) => {
        e.stopPropagation();
        setDeleteModal({ show: true, courseId: id });
    };

    const confirmDeleteCourse = async () => {
        if (!deleteModal.courseId) return;
        try {
            await axios.delete(`/courses/${deleteModal.courseId}`);
            fetchMyCourses();
            showToast('Course Deleted Successfully', 'success');
            setDeleteModal({ show: false, courseId: null });
        } catch (error) {
            console.error('Error deleting course:', error);
            showToast('Failed to delete course', 'error');
            setDeleteModal({ show: false, courseId: null });
        }
    };

    const handleEditCourse = async (id, e) => {
        e.stopPropagation();
        try {
            const response = await axios.get(`/courses/${id}`);
            // Ensure data structure matches what builder expects
            setCourseData(response.data);
            setHistory([response.data]);
            setHistoryIndex(0);
            setView('builder');
        } catch (error) {
            console.error('Error loading course for edit:', error);
            alert('Failed to load course details');
        }
    };


    const handleInputModalSubmit = () => {
        const value = inputModal.value.trim();
        if (!value) return;

        if (inputModal.type === 'ADD_MODULE') {
            const newModule = {
                id: Date.now(),
                name: value,
                concepts: []
            };
            const newData = {
                ...courseData,
                modules: [...courseData.modules, newModule]
            };
            setCourseData(newData);
            addToHistory(newData);

        } else if (inputModal.type === 'EDIT_MODULE') {
            const newData = {
                ...courseData,
                modules: courseData.modules.map(m =>
                    m.id === inputModal.targetId ? { ...m, name: value } : m
                )
            };
            setCourseData(newData);
            addToHistory(newData);

        } else if (inputModal.type === 'ADD_CONCEPT') {
            setActiveModuleId(inputModal.targetId);
            setActiveConcept({ id: null, name: value, explanation: '' });
            setView('concept_editor');
        }

        setInputModal({ isOpen: false, type: '', value: '', targetId: null, title: '' });
    };

    const handleAddModule = () => {
        setInputModal({ isOpen: true, type: 'ADD_MODULE', value: '', targetId: null, title: 'Create New Module' });
    };

    const handleEditModule = (moduleId, currentName) => {
        setInputModal({ isOpen: true, type: 'EDIT_MODULE', value: currentName, targetId: moduleId, title: 'Edit Module Name' });
    };

    const handleDeleteModule = (moduleId) => {
        if (window.confirm("Are you sure you want to delete this module?")) {
            const newData = {
                ...courseData,
                modules: courseData.modules.filter(m => m.id !== moduleId)
            };
            setCourseData(newData);
            addToHistory(newData);
        }
    };

    const handleAddConcept = (moduleId) => {
        setInputModal({ isOpen: true, type: 'ADD_CONCEPT', value: '', targetId: moduleId, title: 'Create New Concept' });
    };

    const handleEditConcept = (moduleId, concept) => {
        setActiveModuleId(moduleId);
        setActiveConcept({ ...concept }); // Clone to avoid direct mutation
        setView('concept_editor');
    };

    const handleDeleteConcept = (moduleId, conceptId) => {
        if (window.confirm("Are you sure you want to delete this concept?")) {
            const newData = {
                ...courseData,
                modules: courseData.modules.map(m => {
                    if (m.id === moduleId) {
                        return {
                            ...m,
                            concepts: m.concepts.filter(c => c.id !== conceptId)
                        };
                    }
                    return m;
                })
            };
            setCourseData(newData);
            addToHistory(newData);
        }
    };

    const handleSaveConcept = () => {
        const newData = {
            ...courseData,
            modules: courseData.modules.map(m => {
                if (m.id === activeModuleId) {
                    // Check if updating existing or adding new
                    const exists = m.concepts.some(c => c.id === activeConcept.id);
                    let newConcepts;

                    if (exists && activeConcept.id) {
                        newConcepts = m.concepts.map(c => c.id === activeConcept.id ? { ...c, ...activeConcept } : c);
                    } else {
                        newConcepts = [...m.concepts, { ...activeConcept, id: Date.now() }];
                    }

                    return {
                        ...m,
                        concepts: newConcepts
                    };
                }
                return m;
            })
        };
        setCourseData(newData);
        addToHistory(newData);
        setView('builder');
        setActiveModuleId(null);
        setActiveConcept({ id: null, name: '', explanation: '' });
    };

    const toggleAdvantage = (key) => {
        const newData = {
            ...courseData,
            learnerAdvantages: {
                ...courseData.learnerAdvantages,
                [key]: !courseData.learnerAdvantages[key]
            }
        };
        setCourseData(newData);
        addToHistory(newData);
    };

    if (view === 'concept_editor') {
        return (
            <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => setView('builder')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-[#2C4B64]">Edit Concept Content</h2>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={activeConcept.name}
                                onChange={(e) => setActiveConcept(prev => ({ ...prev, name: e.target.value }))}
                                className="text-gray-500 text-sm bg-transparent border-b border-gray-300 focus:border-[#2C4B64] focus:outline-none w-64"
                            />
                            <Edit3 size={12} className="text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                    {/* Toolbar Placeholder */}
                    <div className="border-b border-gray-100 p-2 flex gap-2">
                        <button className="p-2 hover:bg-gray-50 rounded text-gray-500"><Type size={18} /></button>
                    </div>
                    <textarea
                        className="w-full h-[60vh] p-6 text-lg text-gray-700 focus:outline-none resize-none"
                        placeholder="Start typing your comprehensive explanation here..."
                        value={activeConcept.explanation}
                        onChange={(e) => setActiveConcept({ ...activeConcept, explanation: e.target.value })}
                    ></textarea>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={() => setView('builder')}
                        className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveConcept}
                        className="px-6 py-2.5 rounded-lg bg-[#2C4B64] text-white font-medium hover:bg-[#1a3145] transition-colors shadow-lg shadow-blue-900/10"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'builder') {
        return (
            <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <p className="text-xs font-bold text-[#3B6088] tracking-wider uppercase mb-1">{courseData.id ? 'Edit Course' : 'Create New Course'}</p>
                        <input
                            type="text"
                            placeholder="Enter Course Title..."
                            className="text-4xl font-bold text-[#2C4B64] bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-300 w-full"
                            value={courseData.title}
                            onChange={(e) => {
                                handleUpdateCourse('title', e.target.value);
                                if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                            }}
                            onBlur={() => addToHistory(courseData)}
                        />
                        {errors.title && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.title}</p>}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Undo"
                        >
                            <Undo size={18} />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Redo"
                        >
                            <Redo size={18} />
                        </button>
                    </div>
                </div>

                {/* Banner Image */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
                    <h3 className="text-lg font-bold text-[#2C4B64] mb-3 flex items-center gap-2">
                        Course Banner
                    </h3>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                    />
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors group relative overflow-hidden"
                        onClick={() => fileInputRef.current.click()}
                    >
                        {courseData.bannerImage ? (
                            <img src={getImageUrl(courseData.bannerImage)} alt="Banner Preview" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-blue-50 text-[#3B6088] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Image size={24} />
                                </div>
                                <p className="text-sm font-bold text-gray-700">Click to upload banner image</p>
                                <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG (Recommended 1200x400px)</p>
                            </>
                        )}
                        {courseData.bannerImage && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="bg-white text-[#2C4B64] px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2">
                                    <Edit3 size={16} /> Change Image
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Course Objective */}
                <div className="bg-[#fff] p-6 rounded-xl border border-[#EAE0D5] mb-8">
                    <h3 className="text-lg font-bold text-[#2C4B64] mb-3 flex items-center gap-2">
                        Course Objective
                    </h3>
                    <textarea
                        placeholder="Describe the main goals and outcomes of this course..."
                        className={`w-full bg-transparent border-none text-gray-600 focus:outline-none focus:ring-0 resize-none h-24 text-sm leading-relaxed placeholder-gray-400 ${errors.objective ? 'bg-red-50' : ''}`}
                        value={courseData.objective}
                        onChange={(e) => {
                            handleUpdateCourse('objective', e.target.value);
                            if (errors.objective) setErrors(prev => ({ ...prev, objective: '' }));
                        }}
                        onBlur={() => addToHistory(courseData)}
                    ></textarea>
                    {errors.objective && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.objective}</p>}
                </div>

                {/* Modules Section */}
                <div className="space-y-6 mb-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-[#2C4B64]">Course Modules</h3>
                        {errors.modules && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle size={14} /> {errors.modules}</p>}
                        {/* Adding module button implies creating new modules */}
                    </div>

                    {courseData.modules.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-[#fff]">
                            <p className="text-gray-400 mb-4">No modules created yet.</p>
                            <button
                                onClick={handleAddModule}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                + Create First Module
                            </button>
                        </div>
                    )}

                    {courseData.modules.map((module, index) => (
                        <div key={module.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-[#3B6088] px-6 py-4 flex justify-between items-center text-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                                        {index + 1}
                                    </div>
                                    <h4 className="font-bold text-lg">{module.name}</h4>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="p-1.5 hover:bg-white/10 rounded text-white/80"
                                        onClick={() => handleEditModule(module.id, module.name)}
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        className="p-1.5 hover:bg-white/10 rounded text-white/80"
                                        onClick={() => handleDeleteModule(module.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 bg-white">
                                <div className="space-y-3 mb-4">
                                    {module.concepts.map((concept) => (
                                        <div key={concept.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 group">
                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                            <span className="text-gray-700 font-medium flex-1">{concept.name}</span>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-1.5 hover:bg-gray-200 rounded text-gray-500"
                                                    onClick={() => handleEditConcept(module.id, concept)}
                                                    title="Edit Concept"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    className="p-1.5 hover:bg-red-50 rounded text-red-500"
                                                    onClick={() => handleDeleteConcept(module.id, concept.id)}
                                                    title="Delete Concept"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <span className="text-xs text-gray-400 italic">Content added</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handleAddConcept(module.id)}
                                    className="flex items-center gap-2 text-sm font-bold text-[#3B6088] hover:text-[#2C4B64] px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                >
                                    <Plus size={16} />
                                    Create New Concept
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleAddModule}
                        className="w-full py-4 border-2 border-dashed border-[#3B6088]/30 rounded-xl text-[#3B6088] font-bold hover:bg-[#3B6088]/5 transition-colors flex items-center justify-center gap-2 bg-[#fff]"
                    >
                        <Plus size={20} />
                        Add Another Module
                    </button>
                </div>

                {/* Learner Advantages (Checkboxes) */}
                <div className="bg-[#F8F9FA] p-8 rounded-xl border border-gray-200 mb-8">
                    <h3 className="text-xl font-bold text-[#2C4B64] mb-6">Learner Advantages</h3>

                    <div className="space-y-4">
                        <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${courseData.learnerAdvantages.notes ? 'border-[#3B6088] bg-white shadow-md' : 'border-transparent hover:bg-white'}`}>
                            <div className={`mt-1 w-6 h-6 rounded border flex items-center justify-center transition-colors ${courseData.learnerAdvantages.notes ? 'bg-[#3B6088] border-[#3B6088]' : 'bg-white border-gray-300'}`}>
                                {courseData.learnerAdvantages.notes && <CheckSquare className="text-white w-4 h-4" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={courseData.learnerAdvantages.notes}
                                onChange={() => toggleAdvantage('notes')}
                            />
                            <div>
                                <div className="font-bold text-gray-800 flex items-center gap-2 mb-1">
                                    <FileText size={18} className="text-red-500" />
                                    Download Notes (PDF)
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Enable this option to provide students with downloadable PDF notes for each module.
                                    Students can access comprehensive study materials offline.
                                </p>
                            </div>
                        </label>

                        <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${courseData.learnerAdvantages.certification ? 'border-[#3B6088] bg-white shadow-md' : 'border-transparent hover:bg-white'}`}>
                            <div className={`mt-1 w-6 h-6 rounded border flex items-center justify-center transition-colors ${courseData.learnerAdvantages.certification ? 'bg-[#3B6088] border-[#3B6088]' : 'bg-white border-gray-300'}`}>
                                {courseData.learnerAdvantages.certification && <CheckSquare className="text-white w-4 h-4" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={courseData.learnerAdvantages.certification}
                                onChange={() => toggleAdvantage('certification')}
                            />
                            <div>
                                <div className="font-bold text-gray-800 flex items-center gap-2 mb-1">
                                    <Award size={18} className="text-green-500" />
                                    Free Certification
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Select this option to offer students a professional certificate upon course completion.
                                    Significant value added to the learning experience.
                                </p>
                                {courseData.learnerAdvantages.certification && (
                                    <div className="mt-4 p-4 border border-dashed border-blue-200 rounded-lg bg-blue-50/50 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-sm text-[#3B6088] max-w-[70%]">
                                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center shadow-sm shrink-0">
                                                <Award size={16} />
                                            </div>
                                            <span className="truncate">
                                                {courseData.learnerAdvantages.certificationFile
                                                    ? (typeof courseData.learnerAdvantages.certificationFile === 'string' && courseData.learnerAdvantages.certificationFile.startsWith('data:')
                                                        ? "New file selected"
                                                        : "Certificate file uploaded")
                                                    : "Upload Certificate Template (PDF, PNG)"}
                                            </span>
                                        </div>
                                        <input
                                            type="file"
                                            ref={certificateInputRef}
                                            className="hidden"
                                            accept=".pdf,image/*"
                                            onChange={handleCertificateChange}
                                        />
                                        <button
                                            onClick={() => certificateInputRef.current.click()}
                                            className="px-3 py-1 bg-[#3B6088] text-white text-xs font-bold rounded hover:bg-[#2C4B64] transition-colors"
                                        >
                                            {courseData.learnerAdvantages.certificationFile ? "Change File" : "Choose File"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end items-center pt-6 border-t border-gray-200">
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-50 bg-white"
                        >
                            Cancel
                        </button>
                        <button
                            className="px-8 py-2 bg-[#3B6088] rounded-lg text-white font-bold hover:bg-[#2C4B64] shadow-lg shadow-blue-900/20"
                            onClick={handlePublish}
                        >
                            {courseData.id ? 'Update Course' : 'Publish Course'}
                        </button>
                    </div>
                </div>

                {
                    toast.show && (
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => setToast({ ...toast, show: false })}
                        />
                    )
                }

                {/* Input Modal */}
                {inputModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-[#2C4B64] mb-4">{inputModal.title}</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={inputModal.value}
                                        onChange={(e) => setInputModal(prev => ({ ...prev, value: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && handleInputModalSubmit()}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6088] focus:border-[#3B6088] outline-none transition-all"
                                        placeholder="Enter module name..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setInputModal({ isOpen: false, type: '', value: '', targetId: null, title: '' })}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleInputModalSubmit}
                                        disabled={!inputModal.value.trim()}
                                        className="px-4 py-2 text-sm font-bold text-white bg-[#3B6088] hover:bg-[#2C4B64] rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {inputModal.type.includes('EDIT') ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancel Confirmation Modal */}
                {
                    cancelModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
                                <div className="p-6">
                                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Discard Changes</h3>
                                    <p className="text-sm text-center text-gray-500 mb-6">
                                        Are you sure you want to cancel? Any unsaved changes will be lost.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setCancelModal(false)}
                                            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            Keep Editing
                                        </button>
                                        <button
                                            onClick={confirmCancel}
                                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                                        >
                                            Discard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    }

    // Default Dashboard View for Instructor
    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#2C4B64]">My Courses</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and update your created courses.</p>
                </div>
                <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                    <button
                        onClick={handleStartCreate}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#3B6088] text-white rounded-xl font-bold hover:bg-[#2C4B64] transition-all shadow-lg shadow-blue-900/20"
                    >
                        <Plus size={20} />
                        Create New Course
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
                                        { id: 'all', label: 'All Courses', color: 'bg-[#3B6088]' },
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
                                placeholder="Search course name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3B6088]/20 focus:border-[#3B6088] transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {myCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                        <BookOpen size={48} className="text-[#3B6088]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#2C4B64] mb-2">No Courses Yet</h2>
                        <p className="text-gray-500 max-w-md mx-auto">
                            No courses are available in this status.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myCourses.map((course) => (
                            <div key={course.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group hover:shadow-lg transition-all duration-300">
                                <div className="h-48 relative overflow-hidden bg-gray-100">
                                    {course.banner_image ? (
                                        <img src={getImageUrl(course.banner_image)} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Image size={40} />
                                        </div>
                                    )}
                                    {/* Status Badge */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full tracking-wider shadow-sm backdrop-blur-sm ${course.status === 'pending'
                                            ? 'bg-orange-500/90 text-white'
                                            : course.status === 'accepted' || course.status === 'published'
                                                ? 'bg-green-500/90 text-white'
                                                : course.status === 'rejected'
                                                    ? 'bg-red-500/90 text-white'
                                                    : 'bg-white/90 text-[#3B6088]'
                                            }`}>
                                            {(course.status || 'pending').charAt(0).toUpperCase() + (course.status || 'pending').slice(1)}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button
                                            onClick={(e) => handleEditCourse(course.id, e)}
                                            className="p-2 bg-white/90 backdrop-blur rounded-lg text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                                            title="Edit Course"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteCourse(course.id, e)}
                                            className="p-2 bg-white/90 backdrop-blur rounded-lg text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                                            title="Delete Course"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-lg text-[#2C4B64] mb-2 line-clamp-1">{course.title}</h3>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{course.objective || 'No description provided.'}</p>

                                    <div className="mt-auto flex justify-between items-center text-xs font-medium text-gray-400 border-t border-gray-50 pt-4">
                                        <div className="flex items-center gap-1">
                                            <MoreVertical size={14} />
                                            {course.modules_count || 0} Modules
                                        </div>
                                        <div>
                                            {new Date(course.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination - Matching Super Admin Style */}
                    {pagination.total > 6 && (
                        <div className="flex items-center justify-between mt-4 pt-6 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 tracking-wider">
                                Showing <span className="text-gray-900">{(pagination.page - 1) * 6 + 1}</span> to <span className="text-gray-900">{Math.min(pagination.page * 6, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> courses
                            </p>
                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                <button
                                    onClick={() => fetchMyCourses(Math.max(1, pagination.page - 1))}
                                    disabled={pagination.page === 1}
                                    className={`p-2 rounded-lg transition-all ${pagination.page === 1 ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                                >
                                    <ArrowLeft size={18} strokeWidth={2.5} />
                                </button>

                                <div className="flex items-center gap-1 px-2 overflow-x-auto max-w-[200px] no-scrollbar">
                                    {Array.from({ length: pagination.totalPages }).map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => fetchMyCourses(i + 1)}
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
                                    onClick={() => fetchMyCourses(Math.min(pagination.totalPages, pagination.page + 1))}
                                    disabled={pagination.page === pagination.totalPages}
                                    className={`p-2 rounded-lg transition-all ${pagination.page === pagination.totalPages ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                                >
                                    <ChevronDown className="-rotate-90" size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}



            {/* Cancel Confirmation Modal */}
            {
                cancelModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                </div>
                                <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Discard Changes?</h3>
                                <p className="text-sm text-center text-gray-500 mb-6">
                                    Are you sure you want to cancel? Any unsaved changes will be lost.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setCancelModal(false)}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Keep Editing
                                    </button>
                                    <button
                                        onClick={confirmCancel}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                                    >
                                        Discard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Confirmation Modal */}
            {
                deleteModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Delete Course</h3>
                                <p className="text-sm text-center text-gray-500 mb-6">
                                    Are you sure you want to permanently delete this course?
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteModal({ show: false, courseId: null })}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteCourse}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Toast Notification */}
            {
                toast.show && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast({ ...toast, show: false })}
                    />
                )
            }
        </div >
    );
};

/* --- Student Components (Existing Code Refactored) --- */

const StudentCourseView = ({ user }) => {
    const [view, setView] = useState('catalog'); // 'catalog', 'player'
    const [courses, setCourses] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [enrollModal, setEnrollModal] = useState({ show: false, courseId: null, title: '' });
    const [activeCourseId, setActiveCourseId] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'in_progress', 'completed'
    const [stats, setStats] = useState({ enrolledCount: 0, completedCount: 0 });
    const [activityData, setActivityData] = useState([]);
    const [activityRange, setActivityRange] = useState(7); // 7 or 30 days
    const [activityType, setActivityType] = useState('joined'); // 'joined' or 'finished'
    const [activityLoading, setActivityLoading] = useState(false);
    const [showActivityTypeDropdown, setShowActivityTypeDropdown] = useState(false);
    const activityDropdownRef = useRef(null);
    const allCoursesRef = useRef(null);

    // Get search from URL if present
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialSearch = queryParams.get('search') || '';
    const [searchQuery, setSearchQuery] = useState(initialSearch);

    const fetchCourses = async (page = 1, filter = activeFilter, search = searchQuery) => {
        setLoading(true);
        try {
            const offset = (page - 1) * 6;
            const res = await axios.get(`/student/courses`, {
                params: {
                    userId: user.id,
                    limit: 6,
                    offset,
                    filter,
                    search // Pass search param
                }
            });
            setCourses(res.data.courses);
            setStats({
                enrolledCount: res.data.enrolledCount || 0,
                completedCount: res.data.completedCount || 0
            });
            setPagination({
                page: res.data.page,
                totalPages: res.data.totalPages,
                total: res.data.total
            });
        } catch (err) {
            console.error("Failed to fetch courses", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivityData = async () => {
        if (!user?.id) return;
        setActivityLoading(true);
        try {
            const res = await axios.get(`/student/activity`, {
                params: {
                    userId: user.id,
                    range: activityRange,
                    type: activityType
                }
            });
            setActivityData(res.data);
        } catch (err) {
            console.error("Failed to fetch activity data", err);
        } finally {
            setActivityLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search or just fetch on effect
        const timer = setTimeout(() => {
            if (user?.id) fetchCourses(1, activeFilter, searchQuery);
        }, 300); // Simple debounce
        return () => clearTimeout(timer);
    }, [user?.id, activeFilter, searchQuery]);

    useEffect(() => {
        fetchActivityData();
    }, [user?.id, activityRange, activityType]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activityDropdownRef.current && !activityDropdownRef.current.contains(event.target)) {
                setShowActivityTypeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchCourses(newPage, activeFilter, searchQuery);
        }
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const initiateEnroll = (course) => {
        setEnrollModal({ show: true, courseId: course.id, title: course.title });
    };

    const confirmEnroll = async () => {
        // Show enrolling state if needed, but user asked for "immediately show toast" ideally after action
        // or they might mean "don't wait for page reload".
        try {
            await axios.post('/student/enroll', {
                userId: user.id,
                courseId: enrollModal.courseId
            });

            // Show toast IMMEDIATELY after success
            setToast({ show: true, message: 'Enrolled Successfully! Happy Learning.', type: 'success' });

            const courseId = enrollModal.courseId;
            // Close modal immediately
            setEnrollModal({ show: false, courseId: null, title: '' });

            // Refresh list in background
            fetchCourses(pagination.page, activeFilter, searchQuery);

            // Navigate to player
            handleContinue(courseId);

        } catch (err) {
            setToast({ show: true, message: err.response?.data?.error || 'Enrollment failed', type: 'error' });
            setEnrollModal({ show: false, courseId: null, title: '' });
        }
    };

    const handleContinue = (courseId) => {
        setActiveCourseId(courseId);
        setView('player');
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('data:')) return imagePath;
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:5000${imagePath}`;
    };

    if (view === 'player') {
        return (
            <StudentCoursePlayer
                user={user}
                courseId={activeCourseId}
                onBack={() => {
                    setView('catalog');
                    fetchCourses(pagination.page, activeFilter, searchQuery);
                }}
            />
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header Section with Title and Filters */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[#2C4B64]">Explore Courses</h1>
                        <p className="text-gray-500 text-sm mt-1">Discover new skills and track your learning journey.</p>
                    </div>
                </div>

                {/* Dashboard Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Active Courses Card */}
                    <div className="bg-[#FFF] p-6 rounded-2xl border border-[#EAE6D8] relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#EAE6D8]/40 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Enrolled Courses</p>
                        <h3 className="text-4xl font-bold text-[#2C4B64] mb-1 relative z-10">{stats.enrolledCount}</h3>
                        <p className="text-[10px] text-gray-400 font-medium relative z-10 tracking-tight">Total courses joined</p>
                    </div>

                    {/* Hours Learned Card */}
                    <div className="bg-[#FFF] p-6 rounded-2xl border border-[#EAE6D8] relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#EAE6D8]/40 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Completed Courses</p>
                        <h3 className="text-3xl font-bold text-[#2C4B64] mb-1 relative z-10">{stats.completedCount}</h3>
                        <p className="text-[10px] text-gray-400 font-medium relative z-10 tracking-tight">Courses finished</p>
                    </div>

                    {/* Continue Learning Card */}
                    <div className="bg-[#2C4B64] p-6 rounded-2xl border border-[#1a3145] relative overflow-hidden group hover:shadow-lg transition-all">
                        {/* Decorative Background Icon */}
                        <div className="absolute bottom-[-10px] right-[-10px] opacity-10 text-white rotate-12">
                            <Award size={100} />
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1 relative z-10">Continue Learning</h3>
                        <p className="text-xs text-blue-100 mb-4 relative z-10 opacity-70">Pick up where you left off</p>
                        <button
                            onClick={() => allCoursesRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            className="relative z-10 bg-white text-[#2C4B64] px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm"
                        >
                            Resume Course
                        </button>
                    </div>
                </div>

                {/* Learning Activity Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-10 overflow-hidden relative">
                    {activityLoading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B6088]"></div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                        <h3 className="text-xl font-bold text-[#2C4B64] flex items-center gap-2">
                            Learning Activity
                            {/* <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 uppercase tracking-widest">
                                {activityType === 'joined' ? 'Enrollment' : 'Completion'}
                            </span> */}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Range Buttons (Left side of filter) */}
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                {[7, 30].map(range => (
                                    <button
                                        key={range}
                                        onClick={() => setActivityRange(range)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activityRange === range
                                            ? 'bg-white text-[#3B6088] shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        Last {range} days
                                    </button>
                                ))}
                            </div>

                            {/* Custom Elegant Type Dropdown */}
                            <div className="relative min-w-[220px]" ref={activityDropdownRef}>
                                <button
                                    onClick={() => setShowActivityTypeDropdown(!showActivityTypeDropdown)}
                                    className={`w-full flex items-center justify-between bg-white border ${showActivityTypeDropdown ? 'border-[#3B6088] ring-4 ring-[#3B6088]/10 shadow-md' : 'border-gray-200 hover:border-gray-300'} rounded-xl px-5 py-2.5 transition-all duration-300 shadow-sm group`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${activityType === 'joined' ? 'bg-[#3B6088]' : 'bg-green-500'}`}></div>
                                        <span className="text-xs font-bold text-[#2C4B64]">
                                            {activityType === 'joined' ? 'Total courses joined' : 'Courses Finished'}
                                        </span>
                                    </div>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${showActivityTypeDropdown ? 'rotate-180 text-[#3B6088]' : 'group-hover:text-gray-600'}`} />
                                </button>

                                {showActivityTypeDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/50 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {[
                                            { id: 'joined', label: 'Total courses joined', icon: Plus, color: 'text-[#3B6088]' },
                                            { id: 'finished', label: 'Courses Finished', icon: CheckCircle, color: 'text-green-500' }
                                        ].map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => {
                                                    setActivityType(option.id);
                                                    setShowActivityTypeDropdown(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${activityType === option.id ? 'bg-[#3B6088]/5' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg ${activityType === option.id ? 'bg-[#3B6088]/10' : 'bg-gray-50'}`}>
                                                        <option.icon size={14} className={option.color} />
                                                    </div>
                                                    <span className={`text-[11px] font-bold ${activityType === option.id ? 'text-[#3B6088]' : 'text-gray-600'}`}>
                                                        {option.label}
                                                    </span>
                                                </div>
                                                {activityType === option.id && (
                                                    <CheckCircle size={14} className="text-[#3B6088]" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* High-Level Visual Chart */}
                    <div className="h-64 w-full flex items-end justify-between px-2 pb-2 gap-2 relative">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pt-2 pb-12 px-2">
                            {[1, 2, 3, 4].map(line => (
                                <div key={line} className="w-full border-t border-gray-50"></div>
                            ))}
                        </div>

                        {activityData.length > 0 ? (
                            activityData.map((day, i) => {
                                const maxCount = Math.max(...activityData.map(d => parseInt(d.count)), 1);
                                const height = (parseInt(day.count) / (maxCount * 1.2)) * 100;

                                return (
                                    <div key={i} className="flex flex-col items-center gap-3 group flex-1 h-full justify-end">
                                        <div
                                            className={`w-full max-w-[32px] rounded-t-xl transition-all duration-700 ease-out cursor-pointer relative group-hover:shadow-[0_-8px_20px_-8px_rgba(59,96,136,0.3)] ${parseInt(day.count) > 0
                                                ? 'bg-gradient-to-t from-[#3B6088] to-[#60a5fa]'
                                                : 'bg-[#F9FAFB]'
                                                }`}
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-[#2C4B64] text-white text-[11px] font-bold px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-2xl pointer-events-none transform translate-y-2 group-hover:translate-y-0 whitespace-nowrap z-30 flex flex-col items-center">
                                                <span className="text-[10px] text-blue-200 mb-0.5">{day.date}</span>
                                                <span>{day.count} {activityType === 'joined' ? 'Joined' : 'Finished'}</span>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2C4B64]"></div>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${parseInt(day.count) > 0 ? 'text-[#3B6088]' : 'text-gray-300'
                                            } 
                                            ${activityRange === 30 && i % 5 !== 0 ? 'hidden md:block' : ''}
                                        `}>
                                            {activityRange === 7 ? day.day_name : day.date.split(' ')[1]}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-300 italic text-sm">
                                No activity recorded for this period.
                            </div>
                        )}
                    </div>
                </div>

                {/* All Courses Container */}
                <div ref={allCoursesRef} className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-bold text-[#2C4B64]">All Courses</h2>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {/* Search Bar */}
                            <div className="relative group w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#3B6088] transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search courses or instructors..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#3B6088]/20 focus:border-[#3B6088] transition-all"
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex gap-2">
                                {['all', 'in_progress', 'completed'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => handleFilterChange(filter)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeFilter === filter
                                            ? 'bg-[#2C4B64] text-white shadow-md'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {filter === 'all' ? 'All' : filter === 'in_progress' ? 'In Progress' : 'Completed'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20 bg-white rounded-xl border border-gray-100 min-h-[400px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B6088] self-center"></div>
                        </div>
                    ) : courses.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {courses.map(course => (
                                    <div key={course.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-lg transition-all duration-300 group">
                                        {/* Banner Image */}
                                        <div className="h-40 relative bg-gray-100 overflow-hidden">
                                            {course.banner_image ? (
                                                <img src={getImageUrl(course.banner_image)} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-300">
                                                    <Image size={32} />
                                                </div>
                                            )}

                                            {/* Instructor Badge - Bottom Left with impressive styling */}
                                            <div className="absolute bottom-3 left-3 flex items-center gap-2 pr-3 py-1 pl-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg cursor-pointer hover:bg-white/20 transition-colors">
                                                <UserAvatar user={{ fullName: course.instructor_name || 'Inst' }} size="sm" />
                                                <span className="text-[10px] font-bold text-white tracking-wide shadow-black drop-shadow-md truncate max-w-[100px]">
                                                    {course.instructor_name || 'Instructor'}
                                                </span>
                                            </div>

                                            {/* Status Badge */}
                                            {course.is_enrolled && (
                                                <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-sm ${course.progress === 100
                                                    ? 'bg-green-500/90 text-white'
                                                    : 'bg-blue-500/90 text-white'
                                                    }`}>
                                                    {course.progress === 100 ? 'COMPLETED' : 'IN PROGRESS'}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="font-bold text-lg text-[#2C4B64] mb-2 line-clamp-1" title={course.title}>{course.title}</h3>

                                            {/* Objective */}
                                            <p className="text-gray-500 text-xs mb-4 line-clamp-3 flex-1">{course.objective || 'No objective provided.'}</p>

                                            {/* Progress Bar (if enrolled) */}
                                            {course.is_enrolled && (
                                                <div className="mb-4">
                                                    <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1">
                                                        <span>Progress</span>
                                                        <span className="font-bold">{course.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full transition-all duration-500 ${course.progress === 100 ? 'bg-green-500' : 'bg-[#3B6088]'}`}
                                                            style={{ width: `${course.progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Button */}
                                            <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                                    <List size={14} />
                                                    {course.modules_count || 0} Modules
                                                </div>
                                                {course.is_enrolled ? (
                                                    <button
                                                        onClick={() => handleContinue(course.id)}
                                                        className="px-4 py-2 bg-[#3B6088] text-white text-xs font-bold rounded-lg hover:bg-[#2C4B64] transition-colors shadow-sm flex items-center gap-1"
                                                    >
                                                        {course.progress > 0 ? <PlayCircle size={14} /> : <PlayCircle size={14} />}
                                                        {course.progress > 0 ? (course.progress === 100 ? 'Review' : 'Resume') : 'Start'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => initiateEnroll(course)}
                                                        className="px-4 py-2 bg-white border border-[#3B6088] text-[#3B6088] text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors"
                                                    >
                                                        Enroll Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination - Matching Super Admin Style */}
                            {pagination.total > 6 && (
                                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                                    <p className="text-xs font-semibold text-gray-500 tracking-wider">
                                        Showing <span className="text-gray-900">{(pagination.page - 1) * 6 + 1}</span> to <span className="text-gray-900">{Math.min(pagination.page * 6, pagination.total)}</span> of <span className="text-gray-900">{pagination.total}</span> courses
                                    </p>
                                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                        <button
                                            onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                                            disabled={pagination.page === 1}
                                            className={`p-2 rounded-lg transition-all ${pagination.page === 1 ? 'text-gray-300' : 'text-[#3B6088] hover:bg-white hover:shadow-sm active:scale-90'}`}
                                        >
                                            <ArrowLeft size={18} strokeWidth={2.5} />
                                        </button>

                                        <div className="flex items-center gap-1 px-2 overflow-x-auto max-w-[200px] no-scrollbar">
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
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100 border-dashed">
                            <BookOpen size={48} className="text-gray-200 mb-4" />
                            <p className="text-gray-500 font-medium text-lg">No courses found matching this filter.</p>
                            <button
                                onClick={() => handleFilterChange('all')}
                                className="mt-4 px-4 py-2 text-sm text-[#3B6088] hover:underline"
                            >
                                View all courses
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Enroll Confirmation Modal */}
            {enrollModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4 text-[#3B6088]">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#3B6088]">
                                <BookOpen size={20} />
                            </div>
                            <h3 className="text-lg font-bold">Confirm Enrollment</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            You are about to enroll in <span className="font-bold text-gray-800">"{enrollModal.title}"</span>.
                            This will give you instant access to all course materials and progress tracking.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setEnrollModal({ show: false, courseId: null, title: '' })}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmEnroll}
                                className="px-5 py-2 text-sm font-bold text-white bg-[#3B6088] hover:bg-[#2C4B64] rounded-lg shadow-lg shadow-blue-900/10 transition-all active:scale-95"
                            >
                                Yes, Enroll Me
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
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

const StudentCoursePlayer = ({ user, courseId, onBack }) => {
    const [course, setCourse] = useState(null);
    const [activeConcept, setActiveConcept] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                const res = await axios.get(`/student/course/${courseId}?userId=${user.id}`);
                setCourse(res.data);
                // Set initial active concept (first incomplete one or just first one)
                if (res.data.modules.length > 0) {
                    let found = false;
                    for (const m of res.data.modules) {
                        const firstIncomplete = m.concepts.find(c => c.status !== 'completed');
                        if (firstIncomplete) {
                            setActiveConcept(firstIncomplete);
                            found = true;
                            break;
                        }
                    }
                    if (!found && res.data.modules[0].concepts.length > 0) {
                        setActiveConcept(res.data.modules[0].concepts[0]);
                    }
                }
            } catch (err) {
                console.error("Error loading course", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourseDetails();
    }, [courseId, user.id]);

    const handleConceptClick = (concept) => {
        setActiveConcept(concept);
    };

    const markAsComplete = async () => {
        if (!activeConcept) return;
        setCompleting(true);
        try {
            const res = await axios.post('/student/complete-concept', {
                userId: user.id,
                courseId: courseId,
                conceptId: activeConcept.id
            });

            // Update local state
            setCourse(prev => {
                const newModules = prev.modules.map(m => ({
                    ...m,
                    concepts: m.concepts.map(c =>
                        c.id === activeConcept.id ? { ...c, status: 'completed' } : c
                    )
                }));
                return { ...prev, modules: newModules, progress: res.data.progress };
            });

            setActiveConcept(prev => ({ ...prev, status: 'completed' }));

        } catch (err) {
            console.error(err);
        } finally {
            setCompleting(false);
        }
    };

    const handleDownloadCertificate = async () => {
        try {
            const response = await axios.get(`/student/download-certificate/${courseId}?userId=${user.id}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${course.title}_Certificate.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download certificate. Please ensure course is 100% complete.");
        }
    };

    const handleDownloadNotes = async () => {
        try {
            const response = await axios.get(`/student/download-notes/${courseId}?userId=${user.id}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${course.title}_Notes.txt`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download notes.");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-gray-400 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3B6088]"></div>
            <p>Loading your course...</p>
        </div>
    );

    if (!course) return <div className="p-10 text-center">Course not found.</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-[#2C4B64] line-clamp-1">{course.title}</h2>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span className="font-medium">{course.progress}% Completed</span>
                        <div className="w-32 bg-gray-200 rounded-full h-1.5 is-enrolled-prog">
                            <div className="bg-green-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${course.progress}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Left: Content Area */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto p-8 relative flex flex-col">
                    {activeConcept ? (
                        <>
                            <div className="mb-6 pb-4 border-b border-gray-100">
                                <span className="text-xs font-bold text-[#3B6088] tracking-wider mb-2 block">Current Concept</span>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    {activeConcept.name}
                                </h3>
                            </div>

                            <div className="prose max-w-none text-gray-700 leading-relaxed mb-10 flex-1">
                                {activeConcept.explanation ? (
                                    <div className="whitespace-pre-wrap font-serif text-lg">{activeConcept.explanation}</div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-gray-100 rounded-xl text-center bg-gray-50">
                                        <p className="text-gray-400 italic">No content available for this concept yet.</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto border-t border-gray-100 pt-6 flex justify-between items-center sticky bottom-0 bg-white/90 backdrop-blur py-4">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold ${activeConcept.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {activeConcept.status === 'completed' ? <CheckCircle size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>}
                                    {activeConcept.status === 'completed' ? 'Completed' : 'Pending'}
                                </div>

                                <div className="flex gap-3">
                                    {course.progress === 100 && (
                                        <>
                                            {course.notes_enabled && (
                                                <button
                                                    onClick={handleDownloadNotes}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 active:scale-95 animate-in slide-in-from-bottom-4 duration-500"
                                                >
                                                    <FileText size={18} />
                                                    Download Notes
                                                </button>
                                            )}
                                            {course.certification_enabled && (
                                                <button
                                                    onClick={handleDownloadCertificate}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-900/20 active:scale-95 animate-in slide-in-from-bottom-4 duration-500 delay-100"
                                                >
                                                    <Award size={18} />
                                                    Download Certificate
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {activeConcept.status !== 'completed' && (
                                        <button
                                            onClick={markAsComplete}
                                            disabled={completing}
                                            className="px-6 py-2.5 bg-[#3B6088] text-white font-bold rounded-lg hover:bg-[#2C4B64] transition-all shadow-lg shadow-blue-900/10 flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {completing ? 'Updating...' : 'Mark as Complete'} <CheckCircle size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                            <BookOpen size={48} className="text-gray-200" />
                            <p>Select a concept from the right to start learning.</p>
                        </div>
                    )}
                </div>

                {/* Right: Modules & Concepts List */}
                <div className="w-80 bg-gray-50 rounded-xl border border-gray-200 overflow-y-auto flex flex-col shrink-0">
                    <div className="p-4 bg-white border-b border-gray-200 font-bold text-[#2C4B64] flex items-center gap-2 sticky top-0 z-10 shadow-sm">
                        <List size={18} />
                        Course Content
                    </div>
                    <div className="p-3 space-y-4 pb-20">
                        {course.modules.map((module, idx) => (
                            <div key={module.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-4 py-3 bg-gray-100/50 border-b border-gray-100 font-bold text-sm text-gray-700 flex justify-between">
                                    <span className="line-clamp-1" title={module.name}>Module {idx + 1}: {module.name}</span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {module.concepts.length === 0 && <div className="p-4 text-xs text-gray-400 italic text-center">No concepts available</div>}
                                    {module.concepts.map((concept) => (
                                        <button
                                            key={concept.id}
                                            onClick={() => handleConceptClick(concept)}
                                            className={`w-full text-left p-3 text-sm flex items-start gap-3 hover:bg-blue-50 transition-colors ${activeConcept?.id === concept.id ? 'bg-blue-50/80 border-l-4 border-[#3B6088]' : 'border-l-4 border-transparent'}`}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${concept.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                                                {concept.status === 'completed' && <CheckSquare size={10} />}
                                            </div>
                                            <span className={`text-gray-600 line-clamp-2 leading-snug ${activeConcept?.id === concept.id ? 'font-bold text-[#3B6088]' : ''}`}>
                                                {concept.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

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

export default Courses;
