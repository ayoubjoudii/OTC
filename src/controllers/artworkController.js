const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { db } = require('../config/database');
const { UPLOAD_DIR } = require('../config/constants');

// Get all artworks with optional filtering
const getAllArtworks = (req, res) => {
    try {
        const { category, artist, search, minPrice, maxPrice, available, limit = 20, offset = 0 } = req.query;
        
        let query = `
            SELECT a.*, u.username as artist_name, c.name as category_name
            FROM artworks a
            LEFT JOIN users u ON a.artist_id = u.id
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (category) {
            query += ' AND a.category_id = ?';
            params.push(category);
        }

        if (artist) {
            query += ' AND a.artist_id = ?';
            params.push(artist);
        }

        if (search) {
            query += ' AND (a.title LIKE ? OR a.description LIKE ? OR u.username LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (minPrice) {
            query += ' AND a.price >= ?';
            params.push(parseFloat(minPrice));
        }

        if (maxPrice) {
            query += ' AND a.price <= ?';
            params.push(parseFloat(maxPrice));
        }

        if (available !== undefined) {
            query += ' AND a.is_available = ?';
            params.push(available === 'true' ? 1 : 0);
        }

        query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const artworks = db.prepare(query).all(...params);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total
            FROM artworks a
            LEFT JOIN users u ON a.artist_id = u.id
            WHERE 1=1
        `;
        const countParams = [];

        if (category) {
            countQuery += ' AND a.category_id = ?';
            countParams.push(category);
        }
        if (artist) {
            countQuery += ' AND a.artist_id = ?';
            countParams.push(artist);
        }
        if (search) {
            countQuery += ' AND (a.title LIKE ? OR a.description LIKE ? OR u.username LIKE ?)';
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }
        if (minPrice) {
            countQuery += ' AND a.price >= ?';
            countParams.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            countQuery += ' AND a.price <= ?';
            countParams.push(parseFloat(maxPrice));
        }
        if (available !== undefined) {
            countQuery += ' AND a.is_available = ?';
            countParams.push(available === 'true' ? 1 : 0);
        }

        const { total } = db.prepare(countQuery).get(...countParams);

        res.json({
            artworks,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + artworks.length < total
            }
        });
    } catch (error) {
        console.error('Get all artworks error:', error);
        res.status(500).json({ error: 'An error occurred while fetching artworks.' });
    }
};

// Get single artwork by ID
const getArtworkById = (req, res) => {
    try {
        const { id } = req.params;

        const artwork = db.prepare(`
            SELECT a.*, u.username as artist_name, u.bio as artist_bio,
                   c.name as category_name
            FROM artworks a
            LEFT JOIN users u ON a.artist_id = u.id
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.id = ?
        `).get(id);

        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found.' });
        }

        res.json(artwork);
    } catch (error) {
        console.error('Get artwork by ID error:', error);
        res.status(500).json({ error: 'An error occurred while fetching artwork.' });
    }
};

// Create new artwork (artist or admin)
const createArtwork = (req, res) => {
    try {
        const { title, description, price, category_id, is_available = true } = req.body;
        const artistId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: 'Artwork image is required.' });
        }

        const imageUrl = `/${UPLOAD_DIR}/${req.file.filename}`;

        // Verify category exists if provided
        if (category_id) {
            const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
            if (!category) {
                return res.status(400).json({ error: 'Invalid category.' });
            }
        }

        const id = uuidv4();
        db.prepare(`
            INSERT INTO artworks (id, title, description, image_url, price, artist_id, category_id, is_available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, title, description || null, imageUrl, price ? parseFloat(price) : null, artistId, category_id || null, is_available ? 1 : 0);

        const artwork = db.prepare(`
            SELECT a.*, u.username as artist_name, c.name as category_name
            FROM artworks a
            LEFT JOIN users u ON a.artist_id = u.id
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.id = ?
        `).get(id);

        res.status(201).json({
            message: 'Artwork created successfully.',
            artwork
        });
    } catch (error) {
        console.error('Create artwork error:', error);
        res.status(500).json({ error: 'An error occurred while creating artwork.' });
    }
};

// Update artwork (artist owner or admin)
const updateArtwork = (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, category_id, is_available } = req.body;

        const artwork = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found.' });
        }

        // Check ownership (unless admin)
        if (req.user.role !== 'admin' && artwork.artist_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only update your own artworks.' });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (title) {
            updates.push('title = ?');
            values.push(title);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (price !== undefined) {
            updates.push('price = ?');
            values.push(price ? parseFloat(price) : null);
        }
        if (category_id !== undefined) {
            if (category_id) {
                const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(category_id);
                if (!category) {
                    return res.status(400).json({ error: 'Invalid category.' });
                }
            }
            updates.push('category_id = ?');
            values.push(category_id || null);
        }
        if (is_available !== undefined) {
            updates.push('is_available = ?');
            values.push(is_available ? 1 : 0);
        }

        // Handle image update
        if (req.file) {
            // Delete old image
            const oldImagePath = path.join(__dirname, '..', 'public', artwork.image_url);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            
            const imageUrl = `/${UPLOAD_DIR}/${req.file.filename}`;
            updates.push('image_url = ?');
            values.push(imageUrl);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        db.prepare(`UPDATE artworks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const updatedArtwork = db.prepare(`
            SELECT a.*, u.username as artist_name, c.name as category_name
            FROM artworks a
            LEFT JOIN users u ON a.artist_id = u.id
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.id = ?
        `).get(id);

        res.json({
            message: 'Artwork updated successfully.',
            artwork: updatedArtwork
        });
    } catch (error) {
        console.error('Update artwork error:', error);
        res.status(500).json({ error: 'An error occurred while updating artwork.' });
    }
};

// Delete artwork (artist owner or admin)
const deleteArtwork = (req, res) => {
    try {
        const { id } = req.params;

        const artwork = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found.' });
        }

        // Check ownership (unless admin)
        if (req.user.role !== 'admin' && artwork.artist_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own artworks.' });
        }

        // Delete image file
        const imagePath = path.join(__dirname, '..', 'public', artwork.image_url);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        db.prepare('DELETE FROM artworks WHERE id = ?').run(id);

        res.json({ message: 'Artwork deleted successfully.' });
    } catch (error) {
        console.error('Delete artwork error:', error);
        res.status(500).json({ error: 'An error occurred while deleting artwork.' });
    }
};

// Get artworks by current user (artist)
const getMyArtworks = (req, res) => {
    try {
        const artworks = db.prepare(`
            SELECT a.*, c.name as category_name
            FROM artworks a
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.artist_id = ?
            ORDER BY a.created_at DESC
        `).all(req.user.id);

        res.json(artworks);
    } catch (error) {
        console.error('Get my artworks error:', error);
        res.status(500).json({ error: 'An error occurred while fetching your artworks.' });
    }
};

// Get featured artworks (for homepage)
const getFeaturedArtworks = (req, res) => {
    try {
        const { limit = 8 } = req.query;

        const artworks = db.prepare(`
            SELECT a.*, u.username as artist_name, c.name as category_name
            FROM artworks a
            LEFT JOIN users u ON a.artist_id = u.id
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.is_available = 1
            ORDER BY a.created_at DESC
            LIMIT ?
        `).all(parseInt(limit));

        res.json(artworks);
    } catch (error) {
        console.error('Get featured artworks error:', error);
        res.status(500).json({ error: 'An error occurred while fetching featured artworks.' });
    }
};

module.exports = {
    getAllArtworks,
    getArtworkById,
    createArtwork,
    updateArtwork,
    deleteArtwork,
    getMyArtworks,
    getFeaturedArtworks
};
