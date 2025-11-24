const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const artworkController = require('../controllers/artworkController');
const { authenticate, optionalAuth, isArtistOrAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// Validation middleware
const validateCreateArtwork = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title is required and must not exceed 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('category_id')
        .optional()
        .isUUID()
        .withMessage('Invalid category ID'),
    body('is_available')
        .optional()
        .isBoolean()
        .withMessage('is_available must be a boolean')
];

const validateUpdateArtwork = [
    param('id')
        .isUUID()
        .withMessage('Invalid artwork ID'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must not exceed 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('category_id')
        .optional()
        .isUUID()
        .withMessage('Invalid category ID'),
    body('is_available')
        .optional()
        .isBoolean()
        .withMessage('is_available must be a boolean')
];

const validateGetArtworks = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a positive number'),
    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('minPrice must be a positive number'),
    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('maxPrice must be a positive number')
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
router.get('/', validateGetArtworks, handleValidation, artworkController.getAllArtworks);
router.get('/featured', artworkController.getFeaturedArtworks);
router.get('/:id', param('id').isUUID().withMessage('Invalid artwork ID'), handleValidation, artworkController.getArtworkById);

// Protected routes (artist or admin)
router.post('/', 
    authenticate, 
    isArtistOrAdmin,
    upload.single('image'),
    handleUploadError,
    validateCreateArtwork, 
    handleValidation, 
    artworkController.createArtwork
);

router.put('/:id',
    authenticate,
    isArtistOrAdmin,
    upload.single('image'),
    handleUploadError,
    validateUpdateArtwork,
    handleValidation,
    artworkController.updateArtwork
);

router.delete('/:id',
    authenticate,
    isArtistOrAdmin,
    param('id').isUUID().withMessage('Invalid artwork ID'),
    handleValidation,
    artworkController.deleteArtwork
);

// Get artworks by current authenticated artist
router.get('/artist/me', authenticate, isArtistOrAdmin, artworkController.getMyArtworks);

module.exports = router;
