const mongoose = require('mongoose')

const replySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 500 },
  },

  { _id: true,  timestamps : true }
);

const CommentSchema = mongoose.Schema(
    {
        //the user who will post the comment
        user : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required : [true, 'userName is Required']
        },
        //
        post: 
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required : [true, 'Post is Required']
            

        },
        content:
        
        {
            type: String,
            maxlength : 500,
            required: [true, 'no content in comments']
        },
        replies: [replySchema],
        
    },
    {timestamps : true}
)

const Comment = mongoose.model('Comment', CommentSchema)

module.exports = Comment;