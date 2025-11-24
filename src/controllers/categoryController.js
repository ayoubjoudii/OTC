const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');

// Get all categories
const getAllCategories = (req, res) => {
    try {
        const categories = db.prepare(`
            SELECT c.*, COUNT(a.id) as artwork_count
            FROM categories c
            LEFT JOIN artworks a ON c.id = a.category_id
            GROUP BY c.id
            ORDER BY c.name
        `).all();

        res.json(categories);
    } catch (error) {
        console.error('Get all categories error:', error);
        res.status(500).json({ error: 'An error occurred while fetching categories.' });
    }
};

// Get category by ID
const getCategoryById = (req, res) => {
    try {
        const { id } = req.params;

        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        res.json(category);
    } catch (error) {
        console.error('Get category by ID error:', error);
        res.status(500).json({ error: 'An error occurred while fetching category.' });
    }
};

// Create category (admin only)
const createCategory = (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if category already exists
        const existingCategory = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
        if (existingCategory) {
            return res.status(400).json({ error: 'Category with this name already exists.' });
        }

        const id = uuidv4();
        db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)')
            .run(id, name, description || null);

        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

        res.status(201).json({
            message: 'Category created successfully.',
            category
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'An error occurred while creating category.' });
    }
};

// Update category (admin only)
const updateCategory = (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        // Check if new name conflicts with existing category
        if (name && name !== category.name) {
            const existingCategory = db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').get(name, id);
            if (existingCategory) {
                return res.status(400).json({ error: 'Category with this name already exists.' });
            }
        }

        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        values.push(id);
        db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const updatedCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

        res.json({
            message: 'Category updated successfully.',
            category: updatedCategory
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'An error occurred while updating category.' });
    }
};

// Delete category (admin only)
const deleteCategory = (req, res) => {
    try {
        const { id } = req.params;

        const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found.' });
        }

        // Check if category has artworks
        const artworkCount = db.prepare('SELECT COUNT(*) as count FROM artworks WHERE category_id = ?').get(id);
        if (artworkCount.count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete category with existing artworks. Please reassign or delete the artworks first.' 
            });
        }

        db.prepare('DELETE FROM categories WHERE id = ?').run(id);

        res.json({ message: 'Category deleted successfully.' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'An error occurred while deleting category.' });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
