const { validate } = require("mongoose-validator")
const Comment = require("../Models/commentModel")
const Post = require("../Models/postModel")
const Notification = require("../Models/notificationModel")



exports.postComment = async(req,res) =>
{
    const postId = req.params.id //post on which comment is uploaded
    const userId = req.user.id //user uploading the comment
    const content = req.body.content //comment content

    try{
        const post = await Post.findById(postId)

        if(!post)
            {
                return res.status(404).json(
                    {
                        status: "failed to post comment",
                        message : "post with this id not found"
                    }
                )
            }
            //creating the comment
        const newComment = await Comment.create(
            {
                user : userId,
                post : postId,
                content
            }
        )
        const notification = {
            receiver : post.user,
            sender :   userId,
           content: "Commented on your post"
        }
      await Notification.create(notification)
        //push to comment to posts also
        post.comments.push(newComment._id);
        await post.save({validateBeforeSave : false})

        res.status(201).json(
            {
                status: "success",
                message : "Comment Created",
                data: 
                {
                    newComment
                }
            }
        )

    }catch(error)
    {
        return res.status(500).json(
            {
                status: "failed to post comment",
                message : "Error Occured :  "+error+" "
            }
        )

    }



}

exports.getComments = async (req, res) =>
{
    
    const postId = req.params.id
    try{
        const post = await Post.findById(postId);
        if(!post)
            {
                return res.status(404).json(
                    {
                        status: "failed to get comments",
                        message : "post with this id not found"
                    }
                )
            }

            const comment = await Comment.find({post : postId}).populate("user", "name profilePic")


            res.status(200).json(
                {
                    status: "success",
                    message: "comments found",
                    data: {
                        comment
                    }
                }
            )

    }catch(error)
    {
        return res.status(404).json(
            {
                status: "failed to get comments",
                message : error
            }
        )
    }
}

exports.updateComments = async (req,res) =>
    {
        const commentId = req.params.id
        const content = req.body.content
        const userId = req.user.id

        try
        {
            const comment = await Comment.findById(commentId)
             // validate input
            if (!content || content.trim() === '') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Content is required to update the comment',
                });

            //check comment exists
            }
            if(!comment)
                {
                    return res.status(404).json(
                        {
                            status: "failed to get comment",
                            message : "comment with this id not found"
                        }
                    )
                }
            //check if user owns the comment
            if(comment.user.toString() !== userId)
                {
                    return res.status(403).json(
                        {
                            status: "failed",
                            message : "The comment is not owned by you"
                        }
                    )
                }
                comment.content = content
                const updatedComment = await comment.save();
                res.status(201).json(
                    {
                        status: "successfull",
                        message: "Comment Updated Successfully",
                        data:
                        {
                            updatedComment
                        }
                    }
                )


        }catch(error)
        {
            return res.status(500).json(
                {
                    status: "failed to edit comments",
                    message : error
                }
            )
        }
        

    }


    exports.deleteComments = async (req,res) =>
        {
            const commentId = req.params.id
            const userId = req.user.id
    
            try
            {
                const comment = await Comment.findById(commentId)
              
    
                //check comment exists
                if(!comment)
                    {
                        return res.status(404).json(
                            {
                                status: "failed to get comment",
                                message : "comment with this id not found"
                            }
                        )
                    }
                //check if user owns the comment
                if(comment.user.toString() !== userId)
                    {
                        return res.status(403).json(
                            {
                                status: "failed",
                                message : "The comment is not owned by you"
                            }
                        )
                    }
                    //delete from post document and from comment document
                     // Remove the comment from the associated post's comments array
                    await Post.findByIdAndUpdate(comment.post, {
                             $pull: { comments: commentId }, // Remove the comment ID from the array
                    });
                    const deletedComment = await comment.deleteOne();
                    
                    res.status(201).json(
                        {
                            status: "successfull",
                            message: "Comment deleted Successfully",
                            data:
                            {
                                deletedComment
                            }
                        }
                    )
    
    
            }catch(error)
            {
                return res.status(500).json(
                    {
                        status: "failed to delete comments",
                        message : error
                    }
                )
            }
            
    
        }


exports.createReply = async(req,res) =>
    {
        const commentId = req.params.id
        const userId = req.user.id
        const content = req.body.content

        try{
            // Validate input
             if (!content || content.trim() === '') {
                    return res.status(400).json({
                             status: 'fail',
                            message: 'Reply content is required',
                    });
        }
            const comment = await Comment.findById(commentId);

            if(!comment)
                {
                    return res.status(404).json(
                        {
                            status: "failed to get comment",
                            message : "comment with this id not found"
                        }
                    )
                }
            const reply =
                {
                    user : userId,
                    content
                }
                

                comment.replies.push(reply)
               const updatedComment =  await comment.save();

               return res.status(201).json(
                {
                    status: "successfull",
                    message: "reply Added",
                    data: 
                    {
                        updatedComment
                    }
                }
               )
        }catch(error)
        {
            return res.status(500).json(
                {
                    status: "failed to add reply",
                    message : error
                }
            )

        }
    }

exports.getReplies = async( req, res) =>
    {
        const commentId = req.params.id

        
            
            try {
                // Find the comment by ID
                const comment = await Comment.findById(commentId) .populate("replies.user", "name profilePic");;
        
                // Check if the comment exists
                if (!comment) {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Comment not found',
                    });
                }
        
                // Return the replies
                res.status(200).json({
                    status: 'success',
                    results: comment.replies.length,
                    data: {
                        replies: comment.replies,
                    },
                });
            } catch (error) {
                res.status(500).json({
                    status: 'fail',
                    message: 'An error occurred while fetching replies',
                    error: error.message,
                });
            }
    }
    