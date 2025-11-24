const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const validateAddFavorite = [
    body('artworkId')
        .isUUID()
        .withMessage('Invalid artwork ID')
];

const validateArtworkId = [
    param('artworkId')
        .isUUID()
        .withMessage('Invalid artwork ID')
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

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', favoriteController.getFavorites);
router.post('/', validateAddFavorite, handleValidation, favoriteController.addFavorite);
router.delete('/:artworkId', validateArtworkId, handleValidation, favoriteController.removeFavorite);
router.get('/check/:artworkId', validateArtworkId, handleValidation, favoriteController.checkFavorite);

module.exports = router;
