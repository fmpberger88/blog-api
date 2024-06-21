const express = require('express');
const Comments = require('../models/Comments');
const { body, validationResult } = require('express-validator');

const commentRouter = express.Router();

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
commentRouter.get('/:blogId', (req, res) => {
    res.json(req.comments);  // Use pre-loaded comments
});

// POST - Post a comment to a blog
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
commentRouter.delete('/:commentId', (req, res) => {
    try {
        // The comment is already loaded and attached to the request
        req.comment.remove();
        res.send('Comment deleted successfully');
    } catch (err) {
        res.status(500).send("Server error");
    }
});


module.exports = commentRouter;
