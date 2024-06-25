const express = require('express');
const Comments = require('../models/comments');
const Blog = require('../models/blogs');
const { body, validationResult } = require('express-validator');
const passport = require('passport');

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
        const comment = await Comments.findById(id).exec();
        if (!comment) {
            return res.status(404).send('Could not find comment');
        }
        req.comment = comment;
        next();
    } catch (err) {
        next(err);
    }
});

// Param middleware for blogId
commentRouter.param('blogId', async (req, res, next, id) => {
    try {
        const blog = await Blog.findById(id).populate('comments').exec();
        if (!blog) {
            return res.status(404).send('Blog not found');
        }
        req.blog = blog;
        next();
    } catch (err) {
        next(err);
    }
});

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
commentRouter.get('/:blogId', async (req, res, next) => {
    try {
        res.json(req.blog.comments);
    } catch (err) {
        next(err);
    }
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
    body('text').trim().isLength({ min: 1 }).withMessage('Comment text must not be empty')
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const newComment = new Comments({
            text: req.body.text,
            blog: req.params.blogId
        });

        await newComment.save();

        req.blog.comments.push(newComment._id);
        await req.blog.save();

        res.status(201).json(newComment);
    } catch (err) {
        next(err);
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
commentRouter.delete('/:commentId', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        // Check if the logged-in user is the author of the comment
        if (req.comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Remove the comment from the database
        await Comments.deleteOne({ _id: req.comment._id }).exec();

        // Remove the comment from the blog's comments array
        await Blog.updateOne({ _id: req.comment.blog }, { $pull: { comments: req.comment._id } }).exec();

        res.send('Comment deleted successfully');
    } catch (err) {
        next(err);
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
 *       properties:
 *         text:
 *           type: string
 *           description: Content of the comment.
 *           minLength: 5
 *           trim: true
 *       example:
 *         text: "This is a great blog post!"
 */

module.exports = commentRouter;
