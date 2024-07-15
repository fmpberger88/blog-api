const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchemaV2 = new Schema({
    text: {
        type: String,
        required: [true, 'Please enter a text'],
        minlength: 5,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommentV2'
    }]
}, {
    timestamps: true
});

const CommentV2 = mongoose.model('CommentV2', commentSchemaV2);
module.exports = CommentV2;