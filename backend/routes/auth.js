const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const passport = require('../config/passport');

const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
    const { fullName, email, password, role } = req.body;

    try {
        // Validate input
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user into database
        const newUser = await pool.query(
            'INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role, created_at',
            [fullName, email, hashedPassword, role]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser.rows[0].id, email: newUser.rows[0].email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser.rows[0].id,
                fullName: newUser.rows[0].full_name,
                email: newUser.rows[0].email,
                role: newUser.rows[0].role,
                isSocialLogin: false
            },
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if user exists
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.rows[0].id, email: user.rows[0].email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.rows[0].id,
                fullName: user.rows[0].full_name,
                email: user.rows[0].email,
                role: user.rows[0].role,
                isSocialLogin: false
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get current user (protected route)
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Include password in select to check if it exists (for isSocialLogin)
        const user = await pool.query(
            'SELECT id, full_name, email, role, password, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user.rows[0].id,
                fullName: user.rows[0].full_name,
                email: user.rows[0].email,
                role: user.rows[0].role,
                createdAt: user.rows[0].created_at,
                isSocialLogin: !user.rows[0].password
            },
        });
    } catch (error) {
        console.error('Auth verification error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

// Google Auth Routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
}));

router.get('/google/callback',
    (req, res, next) => {
        console.log('Google callback received');

        passport.authenticate('google', { session: false }, (err, user, info) => {
            if (err) {
                console.error('Google OAuth Error:', err);
                return res.redirect(`${process.env.FRONTEND_URL}/auth?error=google_oauth_failed&message=${encodeURIComponent(err.message)}`);
            }

            if (!user) {
                console.error('No user returned from Google');
                return res.redirect(`${process.env.FRONTEND_URL}/auth?error=google_no_user`);
            }

            // Generate token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            const userData = {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                avatar: user.avatar_url,
                isSocialLogin: !user.password
            };

            // Redirect to frontend with token
            res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
        })(req, res, next);
    }
);

// GitHub Auth Routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/auth?error=github_failed` }),
    (req, res) => {
        const token = jwt.sign(
            { userId: req.user.id, email: req.user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
            id: req.user.id,
            fullName: req.user.full_name,
            email: req.user.email,
            role: req.user.role,
            avatar: req.user.avatar_url,
            isSocialLogin: !req.user.password
        }))}`);
    }
);

// Change Password Route
router.put('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both current and new passwords are required' });
        }

        // Get user from database to check current password
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password in database
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, decoded.userId]);

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Server error during password change' });
    }
});

// Delete Account Route
router.delete('/delete-account', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Delete user
        // Note: In a real app, you might want soft delete or delete related data first
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [decoded.userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Server error during account deletion' });
    }
});

// Admin: Get all users
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, full_name, email, role, avatar_url, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error while fetching users' });
    }
});

// Admin: Delete a user by ID
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Server error while deleting user' });
    }
});

module.exports = router;
