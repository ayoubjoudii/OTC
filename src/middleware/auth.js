const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const { db } = require('../config/database');

// Verify JWT token
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid token. User not found.' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired.' });
        }
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

// Optional authentication - doesn't fail if no token, but attaches user if present
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(decoded.userId);
        
        if (user) {
            req.user = user;
        }
    } catch (error) {
        // Token invalid, but that's okay for optional auth
    }
    
    next();
};

// Check if user has required role
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Access denied. Not authenticated.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }

        next();
    };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

// Check if user is artist or admin
const isArtistOrAdmin = (req, res, next) => {
    if (!req.user || !['artist', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied. Artist or admin privileges required.' });
    }
    next();
};

module.exports = {
    authenticate,
    optionalAuth,
    authorize,
    isAdmin,
    isArtistOrAdmin
};
