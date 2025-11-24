const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Validation middleware
const validateRegister = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(['visitor', 'artist'])
        .withMessage('Invalid role')
];

const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const validateUpdateProfile = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters')
];

const validateChangePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters')
];

const validateUpdateRole = [
    param('userId')
        .isUUID()
        .withMessage('Invalid user ID'),
    body('role')
        .isIn(['admin', 'artist', 'visitor'])
        .withMessage('Invalid role')
];

// Validation result handler
const handleValidation = (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Public routes
router.post('/register', validateRegister, handleValidation, authController.register);
router.post('/login', validateLogin, handleValidation, authController.login);
router.get('/artists', authController.getArtists);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validateUpdateProfile, handleValidation, authController.updateProfile);
router.put('/password', authenticate, validateChangePassword, handleValidation, authController.changePassword);

// Admin routes
router.get('/users', authenticate, isAdmin, authController.getAllUsers);
router.put('/users/:userId/role', authenticate, isAdmin, validateUpdateRole, handleValidation, authController.updateUserRole);
router.delete('/users/:userId', authenticate, isAdmin, authController.deleteUser);

module.exports = router;
