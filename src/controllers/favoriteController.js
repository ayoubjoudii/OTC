const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');

// Get user's favorites
const getFavorites = (req, res) => {
    try {
        const userId = req.user.id;

        const favorites = db.prepare(`
            SELECT f.id as favorite_id, f.created_at as favorited_at,
                   a.*, u.username as artist_name, c.name as category_name
            FROM favorites f
            JOIN artworks a ON f.artwork_id = a.id
            LEFT JOIN users u ON a.artist_id = u.id
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `).all(userId);

        res.json(favorites);
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'An error occurred while fetching favorites.' });
    }
};

// Add to favorites
const addFavorite = (req, res) => {
    try {
        const userId = req.user.id;
        const { artworkId } = req.body;

        // Check if artwork exists
        const artwork = db.prepare('SELECT id FROM artworks WHERE id = ?').get(artworkId);
        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found.' });
        }

        // Check if already favorited
        const existingFavorite = db.prepare(
            'SELECT id FROM favorites WHERE user_id = ? AND artwork_id = ?'
        ).get(userId, artworkId);
        
        if (existingFavorite) {
            return res.status(400).json({ error: 'Artwork is already in favorites.' });
        }

        const id = uuidv4();
        db.prepare('INSERT INTO favorites (id, user_id, artwork_id) VALUES (?, ?, ?)')
            .run(id, userId, artworkId);

        res.status(201).json({ 
            message: 'Artwork added to favorites.',
            favoriteId: id
        });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ error: 'An error occurred while adding to favorites.' });
    }
};

// Remove from favorites
const removeFavorite = (req, res) => {
    try {
        const userId = req.user.id;
        const { artworkId } = req.params;

        const result = db.prepare(
            'DELETE FROM favorites WHERE user_id = ? AND artwork_id = ?'
        ).run(userId, artworkId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Favorite not found.' });
        }

        res.json({ message: 'Artwork removed from favorites.' });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ error: 'An error occurred while removing from favorites.' });
    }
};

// Check if artwork is favorited
const checkFavorite = (req, res) => {
    try {
        const userId = req.user.id;
        const { artworkId } = req.params;

        const favorite = db.prepare(
            'SELECT id FROM favorites WHERE user_id = ? AND artwork_id = ?'
        ).get(userId, artworkId);

        res.json({ isFavorited: !!favorite });
    } catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({ error: 'An error occurred while checking favorite status.' });
    }
};

module.exports = {
    getFavorites,
    addFavorite,
    removeFavorite,
    checkFavorite
};
