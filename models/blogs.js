const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
       type: String,
       required: [true, 'Title is required'],
       trim: true,
       maxLength: [100, 'Title cannot be more than 100 characters']
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        trim: true,
        minLength: [10, 'Content must be at lest 10 characters']
    },
    author: {
        type: String,
        required: [true, 'Author is required'],
        trim: true,
        lowercase: true,
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
})

const Blog = mongoose.model('Blog', blogSchema)
module.exports = Blog;