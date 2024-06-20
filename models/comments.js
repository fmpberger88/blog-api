const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema({
    text: {
        type: String,
        required: [true, 'Text is required'],
        minlength: 5,
        trim:true
        },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required'],
    }
}, {
    timestamps: true
});

const Comment = mongoose.model('Comment', CommentSchema);
module.exports = Comment;