const mongoose = require('mongoose')
const express = require('express')
const { type } = require('os')

const postSchema = mongoose.Schema(
    {
        user : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required : [true, 'User is Required']
        },
        content : 
        {
            type: String,
            required : [true, 'content is required for post']
        },
        media : 
        [{
            type: String,
            required : [true, 'content is required for post']
        }],

        //**************************************************************************************************** */
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Users who liked the post
        }],
        comments: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment', // Reference to comments on the post
        }],
  /************************************************************************************************************************* */

        createdAt: {
            type: Date,
            default : Date.now()
        },
        updatedAt: 
        {
            type: Date,
            default: Date.now()
        },
        
        
        
    },
    { timestamps: true }
)

   // document functions

    

        const Post = mongoose.model("Post", postSchema);

    module.exports = Post;