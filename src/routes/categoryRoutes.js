const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Validation middleware
const validateCategory = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Category name is required and must not exceed 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters')
];

const validateUpdateCategory = [
    param('id')
        .isUUID()
        .withMessage('Invalid category ID'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Category name must not exceed 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters')
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
router.get('/', categoryController.getAllCategories);
router.get('/:id', param('id').isUUID().withMessage('Invalid category ID'), handleValidation, categoryController.getCategoryById);

// Admin routes
router.post('/', authenticate, isAdmin, validateCategory, handleValidation, categoryController.createCategory);
router.put('/:id', authenticate, isAdmin, validateUpdateCategory, handleValidation, categoryController.updateCategory);
router.delete('/:id', authenticate, isAdmin, param('id').isUUID().withMessage('Invalid category ID'), handleValidation, categoryController.deleteCategory);

module.exports = router;
