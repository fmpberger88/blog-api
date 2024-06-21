const express = require('express');
const Comments = require('../models/Comments');
const { body, validationResult } = require('express-validator');

const commentRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comment
 *   description: Comment management
 */

// Param middleware that will run when 'commentId' is encountered
commentRouter.param('commentId', async (req, res, next, id) => {
    try {
        const comment = await Comments.findById(id);
        if (!comment) {
            return res.status(404).send('Could not find comment');
        }
        req.comment = comment;
        next();
    } catch (err) {
        next(err)
    }
});

// Param middleware for blogId
commentRouter.param('blogId', async (req, res, next, id) => {
    try {
        const comments = await Comments.find({ blog: id });
        if (!comments.length) {
            res.status(404).send('No comments found for this blog');
        }
        req.comments = comments;
        next();
    } catch (err) {
        next(err);
    }
})

// GET - Get all comments for a specific blog
/**
 * @swagger
 * /api/v1/comments/{blogId}:
 *   get:
 *     tags: [Comment]
 *     summary: Get all comments for a specific blog
 *     description: Retrieve a list of all comments associated with a specific blog.
 *     parameters:
 *       - in: path
 *         name: blogId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the blog to retrieve comments from.
 *     responses:
 *       200:
 *         description: An array of comments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       404:
 *         description: No comments found for this blog.
 *       500:
 *         description: Internal server error.
 */
commentRouter.get('/:blogId', (req, res) => {
    res.json(req.comments);  // Use pre-loaded comments
});

// POST - Post a comment to a blog
/**
 * @swagger
 * /api/v1/comments/{blogId}:
 *   post:
 *     tags: [Comment]
 *     summary: Post a comment to a blog
 *     description: Adds a new comment to the specified blog.
 *     parameters:
 *       - in: path
 *         name: blogId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the blog to which the comment will be added.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: Comment created successfully.
 *       400:
 *         description: Validation error.
 *       500:
 *         description: Internal server error.
 */
commentRouter.post('/:blogId', [
    body('text').trim().isLength({ min: 1 }).withMessage('Comment text must not be empty'),
    body('author').notEmpty().withMessage('Author ID is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const newComment = new Comments({
            text: req.body.text,
            author: req.body.author,
            blog: req.params.blogId
        });
        await newComment.save();
        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// DELETE - Delete a comment
/**
 * @swagger
 * /api/v1/comments/{commentId}:
 *   delete:
 *     tags: [Comment]
 *     summary: Delete a comment
 *     description: Deletes a comment based on the comment ID.
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to be deleted.
 *     responses:
 *       200:
 *         description: Comment deleted successfully.
 *       404:
 *         description: Comment not found.
 *       500:
 *         description: Internal server error.
 */
commentRouter.delete('/:commentId', (req, res) => {
    try {
        // The comment is already loaded and attached to the request
        req.comment.remove();
        res.send('Comment deleted successfully');
    } catch (err) {
        res.status(500).send("Server error");
    }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - text
 *         - author
 *       properties:
 *         text:
 *           type: string
 *           description: Content of the comment.
 *           minLength: 5
 *           trim: true
 *         author:
 *           type: string
 *           format: uuid
 *           description: The unique identifier for the user who authored the comment.
 *       example:
 *         text: "This is a great blog post!"
 *         author: 507f1f77bcf86cd799439011
 */




module.exports = commentRouter;
