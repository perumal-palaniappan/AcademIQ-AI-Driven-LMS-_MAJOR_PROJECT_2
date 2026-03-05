// Disable SSL verification for development (fixes OAuth SSL issues)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cors = require('cors');
const path = require('path');
const passport = require('./config/passport');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const analyticsRoutes = require('./routes/analytics');
const studentRoutes = require('./routes/student');
const quizRoutes = require('./routes/quizzes');
const aiRoutes = require('./routes/ai');
const flashcardRoutes = require('./routes/flashcards');
const instructorRoutes = require('./routes/instructor');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(passport.initialize());

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/instructor', instructorRoutes);


// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Database: ${process.env.DB_NAME}`);
});
