const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema({
    text: {
        type: String,
        required: [true, 'Text is required'],
        minlength: 5,
        trim:true
        },
}, {
    timestamps: true
});

const Comment = mongoose.model('Comment', CommentSchema);
module.exports = Comment;