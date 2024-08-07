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
blogRouter.get('/', async(req, res, next) => {
    try {
        const blogs = await Blog.find({ isPublished: true })
            .populate('author')
            .populate('comments')
            .exec()

        res.json(blogs);
    } catch (err) {
        next(err)
    }
});

// GET - Read all blogs by the current user
/**
 * @swagger
 * /api/v1/blogs/users-blogs:
 *  get:
 *    tags: [Blog]
 *    summary: Retrieve all blogs by the current user
 *    description: Get a list of all blogs created by the logged-in user, regardless of publish status.
 *    security:
 *      - BearerAuth: []
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
blogRouter.get('/users-blogs', passport.authenticate('jwt', { session: false}), async(req, res, next) => {
    try {
        const userId = req.user._id
        const blogs = await Blog.find({ author: userId })
            .populate('author')
            .populate('comments')
            .exec();
        res.json(blogs);
    } catch (err) {
        next(err);
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
blogRouter.get('/:id', async(req, res, next) => {
    try {
        const blog = await Blog.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { views: 1 } }, // increment views by 1
            { new: true } // Return the modified document
        )
            .populate('author')
            .populate('comments')
            .exec()

        if (!blog) {
            return res.status(404).json({ message: "Blog not found!"});
        }

        res.status(200).json(blog);
    } catch(err) {
        next(err);
    }
});



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
blogRouter.post('/', passport.authenticate('jwt', { session: false }), upload.single('image'), [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required'),
    body('content')
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()});
    }

    const { title, content } = req.body;
    const author = req.user._id;
    const image = req.file ? req.file.path : null;

    try {
        const newBlog = new Blog({ title, content, author, image });
        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (err) {
        next(err);
    }
});

// PUT - Publish a blog post
/**
 * @swagger
 * /api/v1/blogs/{id}/publish:
 *  put:
 *    tags: [Blog]
 *    summary: Publish a blog post
 *    description: Update the publish status of an existing blog post by ID.
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *        description: Unique ID of the blog to publish
 *    responses:
 *      200:
 *        description: Blog post published successfully
 *      403:
 *        description: Unauthorized
 *      404:
 *        description: Blog not found
 *      500:
 *        description: Internal server error
 */
blogRouter.put('/:id/publish', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.id).exec();
        if (!blog) {
            return res.status(404).json({ message: "Blog not found"});
        }

        // Check if the logged-in user is the author of the blog
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        blog.isPublished = true;
        await blog.save();
        res.status(200).json(blog);

    } catch (err) {
        next(err);
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
blogRouter.put('/:id', passport.authenticate('jwt', { session: false }), upload.single('image'), [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required'),
    body('content')
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters')
], async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, isPublished } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    try {
        const blog = await Blog.findById(req.params.id).exec();
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
        if (image) {
            blog.image = image;
        }
        await blog.save();

        res.status(200).json(blog);
    } catch (err) {
        next(err);
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
blogRouter.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.id).exec();
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if the logged-in user is the author of the blog
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await Blog.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (err) {
        next(err);
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