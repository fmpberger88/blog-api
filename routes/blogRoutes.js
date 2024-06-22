const express = require('express');
const { body, validationResult } = require('express-validator');
const Blog = require('../models/blogs');
const passport = require('passport');
const upload = require('../middlewares/imageLoader');

const blogRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Blog management
 */

// GET - Read all published blogs
/**
 * @swagger
 * /api/v1/blogs:
 *  get:
 *    tags: [Blog]
 *    summary: Retrieve all published blogs
 *    description: Get a list of all blogs that are currently marked as published.
 *    responses:
 *      200:
 *        description: A list of blogs.
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Blog'
 *      500:
 *        description: Internal server error
 */
blogRouter.get('/', async(req, res) => {
    try {
        const blogs = await Blog.find({ isPublished: true })
            .populate('author')
            .populate('comments');

        res.json(blogs);
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// GET - Read a single published blog by ID
/**
 * @swagger
 * /api/v1/blogs/{id}:
 *  get:
 *    tags: [Blog]
 *    summary: Retrieve a single published blog by ID
 *    description: Get a single blog post by blog ID and increment its view count.
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *        description: Unique ID of the blog post
 *    responses:
 *      200:
 *        description: A single blog post.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Blog'
 *      404:
 *        description: Blog not found or not published
 *      500:
 *        description: Internal server error
 */
blogRouter.get('/:id', async(req, res) => {
    try {
        const blog = await Blog.findOneAndUpdate(
            { _id: req.params.id, isPublished: true},
            { $inc: { views: 1 } }, // increment views by 1
            { new: true } // Return the modified document
        ).populate('author').populate('comments')

        if (!blog) {
            res.status(404).send('Blog not found or not published');
        }

        res.json(blog);
    } catch(err) {
        res.status(500).send("Server error");
    }
})

// POST - Create a new blog post
/**
 * @swagger
 * /api/v1/blogs:
 *  post:
 *    tags: [Blog]
 *    summary: Create a new blog post
 *    description: Add a new blog post to the database.
 *    security:
 *      - BearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Blog'
 *    responses:
 *      201:
 *        description: Blog post created successfully
 *      400:
 *        description: Validation error
 *      500:
 *        description: Internal server error
 */
blogRouter.post('/', passport.authenticate('jwt', { session: false }), upload, [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required'),
    body('content')
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()});
    }

    const { title, content } = req.body;
    const author = req.user._id;
    const image = req.file ? req.file.filenme : null;

    try {
        const newBlog = new Blog({ title, content, author, image });
        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// PUT - Update Blog
/**
 * @swagger
 * /api/v1/blogs/{id}:
 *  put:
 *    tags: [Blog]
 *    summary: Update a blog post
 *    description: Update the details of an existing blog post by ID.
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *        description: Unique ID of the blog to update
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Blog'
 *    responses:
 *      200:
 *        description: Blog post updated successfully
 *      400:
 *        description: Validation error
 *      500:
 *        description: Internal server error
 */
blogRouter.put('/:id', passport.authenticate('jwt', { session: false }), upload, [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required'),
    body('content')
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters')
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, isPublished } = req.body;
    const image = req.file ? req.file.filename : req.body.image;

    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if the logged-in user is the author of the blog
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        blog.title = title;
        blog.content = content;
        blog.isPublished = isPublished;
        blog.image = image;
        await blog.save();

        res.json(blog);
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// DELETE - Delete Blog
/**
 * @swagger
 * /api/v1/blogs/{id}:
 *  delete:
 *    tags: [Blog]
 *    summary: Delete a blog post
 *    description: Permanently delete a blog post by ID from the database.
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *        description: Unique ID of the blog to delete
 *    responses:
 *      200:
 *        description: Blog post deleted successfully
 *      500:
 *        description: Internal server error
 */
blogRouter.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if the logged-in user is the author of the blog
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await blog.remove();
        res.send('Blog deleted successfully');
    } catch (err) {
        res.status(500).send("Server error");
    }
});


/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - author
 *       properties:
 *         title:
 *           type: string
 *           description: Title of the blog post.
 *           trim: true
 *           maxLength: 100
 *         content:
 *           type: string
 *           description: Content of the blog post.
 *           trim: true
 *           minLength: 10
 *         author:
 *           type: string
 *           description: Reference to the User who authored the blog post.
 *         image:
 *           type: string
 *           format: binary
 *         comments:
 *           type: array
 *           items:
 *             type: string
 *             description: Array of references to comments on the blog post.
 *         views:
 *           type: number
 *           description: Number of views the blog post has received.
 *           default: 0
 *         isPublished:
 *           type: boolean
 *           description: Status indicating whether the blog post is published.
 *           default: false
 *       example:
 *         title: 'How to Use Swagger with Mongoose'
 *         content: 'This post explains how to document your Mongoose models using Swagger.'
 *         author: '507f1f77bcf86cd799439011'
 *         views: 150
 *         isPublished: true
 */



module.exports = blogRouter;