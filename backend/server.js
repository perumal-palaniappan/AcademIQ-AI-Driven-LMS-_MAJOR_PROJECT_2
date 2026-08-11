// Disable SSL verification for development (fixes OAuth SSL issues)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const passport = require('./config/passport');
const pool = require('./db');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const analyticsRoutes = require('./routes/analytics');
const studentRoutes = require('./routes/student');
const quizRoutes = require('./routes/quizzes');
const aiRoutes = require('./routes/ai');
const flashcardRoutes = require('./routes/flashcards');
const instructorRoutes = require('./routes/instructor');
const deploymentTestRoutes = require('./routes/deploymentTest');

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
app.use('/api/deployment-test', deploymentTestRoutes);


// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Verify the database before accepting API traffic.
const startServer = async () => {
    try {
        await pool.verifyConnection();
        console.log(`Database connection established: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
            console.log(`Database: ${process.env.DB_NAME}`);
        });
    } catch (error) {
        console.error('Database connection failed. Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, and RDS security-group access.');
        console.error(error.message);
        await pool.end();
        process.exit(1);
    }
};

startServer();
