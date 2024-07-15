const express = require('express');
const { body, param, validationResult } = require('express-validator');
const CommentV2 = require('../models/CommentV2');
const BlogV2 = require('../models/BlogV2');
const passport = require('passport');
const isAdmin = require('../middlewares/isAdmin');
const commentRouter = require("./commentRoutes");


const commentRouterV2 = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: CommentsV2
 *   description: Comment management
 */

// Param middleware that will run when 'commitId' is encountered
commentRouterV2.param('commentId', async(req, res, next, id) => {
    try {
        const comment = await CommentV2.findById(id).exec();
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        req.comment = comment;
        next();
    } catch (err) {
        next(err);
    }
});

// Param middleware for blogId
commentRouterV2.param('blogId', async (req, res, next, id) => {
    try {
        const blog = await BlogV2.findById(id).populate('comments').exec();
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        req.blog = blog;
        next();
    } catch (err) {
        next(err);
    }
})

// GET - Read all comments for a blog post
/**
 * @swagger
 * /api/v2/blogs/{blogId}/comments:
 *   get:
 *     tags: [CommentsV2]
 *     summary: Get all comments for a blog post
 *     description: Retrieve all comments for a specific blog post.
 *     parameters:
 *       - in: path
 *         name: blogId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the blog post
 *     responses:
 *       200:
 *         description: A list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommentsV2'
 *       404:
 *         description: Blog post not found
 *       500:
 *         description: Internal server error
 */
commentRouterV2.get('/', async (req, res, next) => {
    try {
        res.status(200).json(req.blog.comments);
    } catch (err) {
        next(err);
    }
});

// POST - Add a new comment to a blog post
/**
 * @swagger
 * /api/v2/blogs/{blogId}/comments:
 *   post:
 *     tags: [CommentsV2]
 *     summary: Add a new comment to a blog post
 *     description: Add a new comment to a specific blog post.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blogId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the blog post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentsV2'
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
commentRouterV2.post('/', passport.authenticate('jwt', { session: false }), [
    body('text').trim().notEmpty().withMessage('Please enter a text').isLength({ min: 5 }).withMessage('Text must be at least 5 characters long')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const comment = new CommentV2({
            text: req.body.text,
            author: req.user._id
        });

        await comment.save();
        req.blog.comments.push(comment._id);
        await req.blog.save();

        res.status(201).json(comment);
    } catch (err) {
        next(err);
    }
});

// POST - Reply to a comment
/**
 * @swagger
 * /api/v2/comments/{commentId}/replies:
 *   post:
 *     tags: [CommentsV2]
 *     summary: Reply to a comment
 *     description: Add a reply to a specific comment.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentsV2'
 *     responses:
 *       201:
 *         description: Reply added successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
commentRouterV2.post('/:commentId/replies', passport.authenticate('jwt', { session: false }), [
    body('text').trim().notEmpty().withMessage('Please enter a text').isLength({ min: 5 }).withMessage('Text must be at least 5 characters long')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const reply = new CommentV2({
            text: req.body.text,
            author: req.user._id
        });

        await reply.save();
        req.comment.replies.push(reply._id);
        await req.comment.save();

        res.status(201).json(reply);
    } catch (err) {
        next(err);
    }
});


/**
 * @swagger
 * components:
 *   schemas:
 *     CommentsV2:
 *       type: object
 *       required:
 *         - text
 *         - author
 *       properties:
 *         text:
 *           type: string
 *           description: The content of the comment
 *           trim: true
 *           minLength: 5
 *         author:
 *           type: string
 *           description: The ID of the user who authored the comment
 *         replies:
 *           type: array
 *           items:
 *             type: string
 *             description: The IDs of the replies to this comment
 *       example:
 *         text: 'This is a comment.'
 *         author: '507f1f77bcf86cd799439011'
 *         replies: ['60d21b4667d0d8992e610c85']
 */

module.exports = commentRouterV2;