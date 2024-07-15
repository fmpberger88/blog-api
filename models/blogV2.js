const mongoose = require('mongoose');
const { Schema } = mongoose;

const blogSchemaV2 = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxLength: [100, 'Title cannot be more than 100 characters']
    },
    content: {
        type: String,
        required: [true, 'Content is required']
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
        ref: 'CommentV2'
    }],
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    tags: [{
        type: String,
        trim: true
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    seoTitle: {
        type: String,
        trim: true,
        maxLength: [60, 'SEO Title cannot be more than 60 characters']
    },
    seoDescription: {
        type: String,
        trim: true,
        maxLength: [160, 'SEO Description cannot be more than 160 characters']
    },
    seoKeywords: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

module.exports = mongoose.models.BlogV2 || mongoose.model('BlogV2', blogSchemaV2);