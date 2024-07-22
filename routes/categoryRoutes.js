const express = require('express');
const { body, validationResult } = require('express-validator');
const categoryRouter = express.Router();
const Category = require('../models/Category');
const isAdmin = require('../middlewares/isAdmin');
const passport = require('passport')

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */

// GET - Read all categories
/**
 * @swagger
 * /api/v2/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     description: Retrieve a list of all categories.
 *     responses:
 *       200:
 *         description: A list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Internal server error
 */
categoryRouter.get('/', async (req, res, next) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (err) {
        next(err);
    }
});

// POST - Create new category
/**
 * @swagger
 * /api/v2/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category
 *     description: Create a new category with a name and description.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */

categoryRouter.post('/', passport.authenticate('jwt', { session: false }), [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Please enter a name')
        .isLength({ max: 50 })
        .withMessage('Title cannot be more than 50 characters')
        .escape(),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Please enter a description')
        .isLength({ max: 200 })
        .withMessage('Description cannot be more than 200 characters')
        .escape(),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const category = new Category({
        name: req.body.name,
        description: req.body.description
    });

    try {
        const newCategory = await category.save();
        res.status(201).json(newCategory)
    } catch (err) {
        next(err);
    }
});

// PATCH - Update Category
/**
 * @swagger
 * /api/v2/categories/{id}:
 *   patch:
 *     tags: [Categories]
 *     summary: Update a category
 *     description: Update a category's name and/or description.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the category to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */

categoryRouter.patch('/:id', passport.authenticate('jwt', { session: false}), [
    body('name')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Title cannot be more than 50 characters')
        .escape(),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Description cannot be more than 200 characters')
        .escape(),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        if (req.body.name !== null) {
            category.name = req.body.name;
        }

        if (req.body.description !== null) {
            category.description = req.body.description;
        }

        const updatedCategory = await category.save();
        res.status(200).json(updatedCategory);

    } catch (err) {
        next(err);
    }
});

// DELETE - Remove category
/**
 * @swagger
 * /api/v2/categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category
 *     description: Delete a category by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the category to delete
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */

categoryRouter.delete('/:id', passport.authenticate('jwt', { session: false }), isAdmin, async (req, res, next) => {
    try {
        await Category.findByIdAndDelete(req.params.id).exec();
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = categoryRouter;

// Swagger Komponenten-Schema für Kategorie
/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the category.
 *           trim: true
 *           maxLength: 50
 *         description:
 *           type: string
 *           description: Description of the category.
 *           trim: true
 *           maxLength: 200
 *       example:
 *         name: 'Technology'
 *         description: 'Articles related to the latest technology trends.'
 */