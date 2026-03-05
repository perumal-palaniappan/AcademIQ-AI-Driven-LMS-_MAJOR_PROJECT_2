const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const pool = require('../db');

// Serialize user for the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, user.rows[0]);
    } catch (err) {
        done(err, null);
    }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('🔍 Google Profile received:', JSON.stringify(profile, null, 2));
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

            console.log('📧 Email:', email);
            console.log('🖼️ Avatar URL:', avatarUrl);

            if (!email) {
                console.error('❌ No email found in Google profile');
                return done(new Error('No email found in Google profile'), null);
            }

            // Check if user exists
            console.log('🔍 Checking for existing user with google_id:', profile.id, 'or email:', email);
            const existingUser = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [profile.id, email]);

            if (existingUser.rows.length > 0) {
                console.log('✅ Found existing user:', existingUser.rows[0].email);

                // Always update avatar_url and google_id to ensure they are current
                // This fixes issues where the avatar might be broken or outdated
                await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3',
                    [profile.id, avatarUrl, existingUser.rows[0].id]);

                return done(null, { ...existingUser.rows[0], google_id: profile.id, avatar_url: avatarUrl });
            }

            // Create new user
            console.log('➕ Creating new user:', profile.displayName, email);
            const newUser = await pool.query(
                'INSERT INTO users (full_name, email, google_id, avatar_url, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [profile.displayName, email, profile.id, avatarUrl, 'student']
            );

            console.log('✅ New user created:', newUser.rows[0]);
            done(null, newUser.rows[0]);
        } catch (err) {
            console.error('❌ Google Auth Error:', err);
            console.error('Error stack:', err.stack);
            done(err, null);
        }
    }
));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email']
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('GitHub Profile:', profile); // Debug log
            let email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

            // If email is not in profile, try to use a placeholder or handle error
            if (!email) {
                // In a real app, you might fetch from GitHub API here
                // For now, we will fail if no email is public
                // Or use a placeholder if you prefer: email = `${profile.username}@github.no-email.com`;
                if (profile.username) {
                    email = `${profile.username}@github.no-email.com`;
                } else {
                    return done(new Error('No email found in GitHub profile'), null);
                }
            }

            const existingUser = await pool.query('SELECT * FROM users WHERE github_id = $1 OR email = $2', [profile.id, email]);

            if (existingUser.rows.length > 0) {
                if (!existingUser.rows[0].github_id) {
                    await pool.query('UPDATE users SET github_id = $1, avatar_url = $2 WHERE id = $3',
                        [profile.id, avatarUrl, existingUser.rows[0].id]);
                    return done(null, { ...existingUser.rows[0], github_id: profile.id, avatar_url: avatarUrl });
                }
                return done(null, existingUser.rows[0]);
            }

            const newUser = await pool.query(
                'INSERT INTO users (full_name, email, github_id, avatar_url, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [profile.displayName || profile.username, email, profile.id, avatarUrl, 'student']
            );

            done(null, newUser.rows[0]);
        } catch (err) {
            console.error('GitHub Auth Error:', err);
            done(err, null);
        }
    }
));

module.exports = passport;
