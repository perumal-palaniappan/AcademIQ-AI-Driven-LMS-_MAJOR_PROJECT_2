import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Settings from './pages/Settings';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AuthCallback from './pages/AuthCallback';
import Quizzes from './pages/Quizzes';
import AINotes from './pages/AINotes';
import Flashcards from './pages/Flashcards';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/ai-notes" element={<AINotes />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </Router>
  );
}

export default App;
