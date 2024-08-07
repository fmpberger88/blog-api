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
        type: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required'],
    },
    image: {
        type: String,
        default: null
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

const Blog = mongoose.model('Blog', blogSchema)
module.exports = Blog;