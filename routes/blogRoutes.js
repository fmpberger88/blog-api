const express = require('express');
const { body, validationResult } = require('express-validator');
const Blog = require('../models/blogs');

const blogRouter = express.Router();

// GET - Read all published blogs
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
blogRouter.post('/', [
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

    const { title, content, author } = req.body;

    try {
        const newBlog = new Blog({ title, content, author });
        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// PUT - Update Blog
blogRouter.put('/:id', [
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

    try {
        const blog = await Blog.findByIdAndUpdate(req.params.id, { title, content, isPublished });
        res.json(blog);
    } catch(err) {
        res.status(500).send("Server error");
    }
});

// DELETE - Delete Blog
blogRouter.delete('/:id', async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
        res.send('Blog deleted successfully');
    } catch (err) {
        res.status(500).send("Server error");
    }
})


module.exports = blogRouter;