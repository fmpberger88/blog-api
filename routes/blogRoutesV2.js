const express = require('express');
const { body, validationResult } = require('express-validator');
const BlogV2 = require('../models/blogV2');
const passport = require('passport');
const upload = require('../middlewares/imageLoader');

const blogRouterV2 = express.Router();

/**
 * @swagger
 * tags:
 *   name: BlogV2
 *   description: Blog management V2
 */

// GET - Read all published blogs
/**
 * @swagger
 * /api/v2/blogs:
 *  get:
 *    tags: [BlogV2]
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
 *                $ref: '#/components/schemas/BlogV2'
 *      500:
 *        description: Internal server error
 */

blogRouterV2.get('/', async (req, res, next) => {
    try {
        const blogs = await BlogV2.find({ isPublished: true })
            .populate('author')
            .populate('comments')
            .exec();

        res.status(200).json(blogs);
    } catch (err) {
        next(err);
    }
});

// GET - Read all blogs by the current user
/**
 * @swagger
 * /api/v2/blogs/users-blogs:
 *  get:
 *    tags: [BlogV2]
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
 *                $ref: '#/components/schemas/BlogV2'
 *      500:
 *        description: Internal server error
 */

blogRouterV2.get('/users-blogs', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const userId = req.user._id;
        const blogs = await BlogV2.find({ author: userId })
            .populate('author')
            .populate('comments')
            .exec();
        res.status(200).json(blogs);
    } catch (err) {
        next(err);
    }
});

// GET - Read a single published blog by ID
/**
 * @swagger
 * /api/v2/blogs/{id}:
 *  get:
 *    tags: [BlogV2]
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
 *              $ref: '#/components/schemas/BlogV2'
 *      404:
 *        description: Blog not found or not published
 *      500:
 *        description: Internal server error
 */

blogRouterV2.get('/:id', async (req, res, next) => {
    try {
        const blogId = req.params.id;
        const blog = await BlogV2.findOneAndUpdate(
            { _id: blogId, isPublished: true },
            { $inc: { views: 1 } }, // increment views by 1
            { new: true } // Return the modified document
        )
            .populate('author')
            .populate('comments')
            .exec()

        if (!blog) {
            return res.status(404).json({ message: "Blog not found "})
        }

        res.status(200).json(blog);
    } catch (err) {
        next(err);
    }
});

// POST - Create a new blog post
/**
 * @swagger
 * /api/v2/blogs:
 *  post:
 *    tags: [BlogV2]
 *    summary: Create a new blog post
 *    description: Add a new blog post to the database.
 *    security:
 *      - BearerAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/BlogV2'
 *    responses:
 *      201:
 *        description: Blog post created successfully
 *      400:
 *        description: Validation error
 *      500:
 *        description: Internal server error
 */

blogRouterV2.post('/', passport.authenticate('jwt', { session: false }), upload.single('image'), [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 100 })
        .withMessage('Title must not be more than 100 characters'),
    body('content')
        .isLength({ min: 10 })
        .withMessage('Content must be at least 300 characters'),
    body('seoTitle')
        .trim()
        .notEmpty()
        .isLength({ max: 60 })
        .withMessage('SEO Title must not be more than 60 characters'),
    body('seoDescription')
        .trim()
        .notEmpty()
        .isLength({ max: 160 })
        .withMessage('SEO Description must not be more than 160 characters'),
], async (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, categories, tags, seoTitle, seoDescription, seoKeywords} = req.body;
    const author = req.user._id;
    const image = req.file ? req.file.path : null;

    try {
        const newBlog = new BlogV2({
            title,
            content,
            author,
            image,
            categories,
            tags,
            seoTitle,
            seoDescription,
            seoKeywords
        });

        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (err) {
        next(err);
    }
});

// PUT - Publish a blog post
/**
 * @swagger
 * /api/v2/blogs/{id}/publish:
 *  put:
 *    tags: [BlogV2]
 *    summary: Publish a blog post
 *    description: Update the publishing status of an existing blog post by ID.
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

blogRouterV2.put('/:id/publish', passport.authenticate('jwt', { session: false}), async (req, res, next) => {
    try {
        const blog = await BlogV2.findById(req.params.id).exec();

        if(!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if the logged-in user is the author of the blog
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        blog.isPublished = true;
        await blog.save();
        return res.json(blog);

    } catch(err) {
        next(err);
    }
});

// PUT - Update Blog
/**
 * @swagger
 * /api/v2/blogs/{id}:
 *  put:
 *    tags: [BlogV2]
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
 *            $ref: '#/components/schemas/BlogV2'
 *    responses:
 *      200:
 *        description: Blog post updated successfully
 *      400:
 *        description: Validation error
 *      500:
 *        description: Internal server error
 */

blogRouterV2.put('/:id', passport.authenticate('jwt', { session: false }), upload.single('image'), [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 100 })
        .withMessage('Title must not be more than 100 characters'),
    body('content')
        .isLength({ min: 10 })
        .withMessage('Content must be at least 300 characters'),
    body('seoTitle')
        .trim()
        .notEmpty()
        .isLength({ max: 60 })
        .withMessage('SEO Title must not be more than 60 characters'),
    body('seoDescription')
        .trim()
        .notEmpty()
        .isLength({ max: 160 })
        .withMessage('SEO Description must not be more than 160 characters'),
], async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, categories, tags, seoTitle, seoDescription, seoKeywords} = req.body;
    const image = req.file ? req.file.path : null;

    try {
        const blog = await BlogV2.findById(req.params.id).exec()
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if the current logged-in user is the author of the blog
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        blog.title = title;
        blog.content = content;
        blog.categories = categories;
        blog.tags = tags;
        blog.seoTitle = seoTitle;
        blog.seoDescription = seoDescription;
        blog.seoKeywords = seoKeywords;
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
 * /api/v2/blogs/{id}:
 *  delete:
 *    tags: [BlogV2]
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

blogRouterV2.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const blog = await BlogV2.findById(req.params.id).exec();
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if the logged-in user is the author of the blog
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await blog.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (err) {
        next(err);
    }
})

/**
 * @swagger
 * components:
 *   schemas:
 *     BlogV2:
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
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *             description: Array of references to categories the blog post belongs to.
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             description: Array of tags associated with the blog post.
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *             description: Array of references to users who liked the blog post.
 *         seoTitle:
 *           type: string
 *           description: SEO optimized title of the blog post.
 *           trim: true
 *           maxLength: 60
 *         seoDescription:
 *           type: string
 *           description: SEO optimized description of the blog post.
 *           trim: true
 *           maxLength: 160
 *         seoKeywords:
 *           type: array
 *           items:
 *             type: string
 *             description: SEO optimized keywords for the blog post.
 *       example:
 *         title: 'How to Use Swagger with Mongoose'
 *         content: 'This post explains how to document your Mongoose models using Swagger.'
 *         author: '507f1f77bcf86cd799439011'
 *         image: 'https://example.com/image.png'
 *         comments: ['60d21b4667d0d8992e610c85']
 *         views: 150
 *         isPublished: true
 *         categories: ['60d21b4667d0d8992e610c86']
 *         tags: ['Swagger', 'Mongoose']
 *         likes: ['60d21b4667d0d8992e610c87']
 *         seoTitle: 'Swagger Documentation'
 *         seoDescription: 'Learn how to use Swagger to document your Mongoose models.'
 *         seoKeywords: ['swagger', 'mongoose', 'documentation']
 */

module.exports = blogRouterV2;

