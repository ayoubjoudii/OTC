const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/constants');

// Register new user
const register = async (req, res) => {
    try {
        const { username, email, password, role = 'visitor' } = req.body;

        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email or username already exists.' });
        }

        // Only admin can create admin accounts
        const finalRole = role === 'admin' && (!req.user || req.user.role !== 'admin') ? 'visitor' : role;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const id = uuidv4();
        db.prepare(`
            INSERT INTO users (id, username, email, password, role)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, username, email, hashedPassword, finalRole);

        // Generate token
        const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.status(201).json({
            message: 'User registered successfully.',
            user: { id, username, email, role: finalRole },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'An error occurred during registration.' });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.json({
            message: 'Login successful.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                bio: user.bio,
                profile_image: user.profile_image
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
};

// Get current user profile
const getProfile = (req, res) => {
    try {
        const user = db.prepare(`
            SELECT id, username, email, role, bio, profile_image, created_at
            FROM users WHERE id = ?
        `).get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'An error occurred while fetching profile.' });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { username, bio } = req.body;
        const userId = req.user.id;

        // Check if username is taken by another user
        if (username) {
            const existingUser = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, userId);
            if (existingUser) {
                return res.status(400).json({ error: 'Username is already taken.' });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];
        
        if (username) {
            updates.push('username = ?');
            values.push(username);
        }
        if (bio !== undefined) {
            updates.push('bio = ?');
            values.push(bio);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const updatedUser = db.prepare(`
            SELECT id, username, email, role, bio, profile_image, created_at, updated_at
            FROM users WHERE id = ?
        `).get(userId);

        res.json({
            message: 'Profile updated successfully.',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'An error occurred while updating profile.' });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId);
        
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(hashedPassword, userId);

        res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'An error occurred while changing password.' });
    }
};

// Get all users (admin only)
const getAllUsers = (req, res) => {
    try {
        const users = db.prepare(`
            SELECT id, username, email, role, bio, profile_image, created_at
            FROM users
            ORDER BY created_at DESC
        `).all();

        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'An error occurred while fetching users.' });
    }
};

// Update user role (admin only)
const updateUserRole = (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['admin', 'artist', 'visitor'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role.' });
        }

        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(role, userId);

        res.json({ message: 'User role updated successfully.' });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'An error occurred while updating user role.' });
    }
};

// Delete user (admin only)
const deleteUser = (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent admin from deleting themselves
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account.' });
        }

        const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'An error occurred while deleting user.' });
    }
};

// Get artists list
const getArtists = (req, res) => {
    try {
        const artists = db.prepare(`
            SELECT u.id, u.username, u.bio, u.profile_image,
                   COUNT(a.id) as artwork_count
            FROM users u
            LEFT JOIN artworks a ON u.id = a.artist_id
            WHERE u.role = 'artist'
            GROUP BY u.id
            ORDER BY u.username
        `).all();

        res.json(artists);
    } catch (error) {
        console.error('Get artists error:', error);
        res.status(500).json({ error: 'An error occurred while fetching artists.' });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers,
    updateUserRole,
    deleteUser,
    getArtists
};
