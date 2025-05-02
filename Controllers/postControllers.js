const Post = require('../Models/postModel')
const User = require('../Models/userModel')

const Notification = require('../Models/notificationModel')


const cloudinary = require("../utils/cloudinaryConfig")


exports.getAllPosts =  async (req, res) => 
{
    try{
        const resPosts = await Post.find()
    
            res.status(200).json({
                status : "success",
                data: resPosts
            })
    }
    catch(error)
    {
        res.status(500).json(
            {
                status : 500,
                message : 'Internal Server Error'
            }
        )
    }
    

        
}

exports.getPostById = async(req,res) =>
    {
        const id = req.params.id 
    
    try{
          const post = await Post.findById(id).populate("user")
         if (!post) {
            return res.status(404).json({
                status: 'fail',
                message: 'Post not found'
            });
        }

         res.status(200).json(

            {
                status: 'success',
                data: post
            }
         )
    }
    catch(error)
    {
        res.status(400).json(
            {
                status: 'failed',
                message: error,
                
            }
        )
    }
    }


exports.createPost = async (req,res) =>
{
    const userId = req.user.id
    let newPost = {};
    //1. check if files exist

    if(req.files.length === 0)
        {
            return res.status(400).json(
                {
                    status: "error",
                    message: "please Upload media for post"
                }
            )
        }

    try{
        const cont = JSON.parse(req.body.content)
        newPost.user = userId 
        newPost.content = cont.content
        newPost.location = cont.location

        const uploadPromise = req.files.map((file) => {
            return cloudinary.uploader.upload(file.path, {folder : 'Zync/posts', resource_type : 'auto'})
        })
        const results = await Promise.all(uploadPromise)

        const mediaUrls = results.map((result) => result.url)

        newPost.media = mediaUrls

        const result =  await Post.create(newPost)

        res.status(201).json(
            {
                status : 'success',
                data : {
                    post : result
                }
            }
        )
    }
    catch(error)
    {
        res.status(400).json(
            {
                status: 400,
                message : error.message
            }
        )
    }
}



exports.changePost = async(req,res) => 
    {
        

        const id = req.params.id 
        const userId = req.user.id

        const updatedPost = req.body
        try{
            const checkpost = await Post.findById(id) 
            
            if (!checkpost) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Post not found'
                });
            }
            if(checkpost.user.toString() !== userId)
                {
                    return res.status(400).json(
                        {
                            status: "failed to update Post",
                            message: "post is not Owned by You"
                        }
                    )
                }

             const post = await Post.findByIdAndUpdate(id, updatedPost, { new : true, runValidators: true})
            

             res.status(200).json(

                {
                    status: 'success',
                    message: 'post is updated',
                    data: post
                }
             )
        }
        catch(error)
        {
            res.status(400).json(
                {
                    status: 'failed',
                    message: error.message,
                    
                }
            )
        }
    }


exports.deletePost = async (req, res) =>
{
        

    const id = req.params.id
    const userId = req.user.id 
    
    try{
        const checkpost = await Post.findById(id) 
        if (!checkpost) {
            return res.status(404).json({
                status: 'fail',
                message: 'Post not found'
            });
        }
        if(checkpost.user.toString() !== userId)
            {
                return res.status(400).json(
                    {
                        status: "failed to update Post",
                        message: "post is not Owned by You"
                    }
                )
            }
          const post = await Post.findByIdAndDelete(id)
         res.status(200).json(

            {
                status: 'success',
                message: 'post is deleted',
                data: post
            }
         )
    }
    catch(error)
    {
        res.status(400).json(
            {
                status: 'failed',
                message: error.message,
                
            }
        )
    }
}



exports.likePost = async (req, res) =>
    {
        const postId = req.params.id
        const userId = req.user.id

        try{
            const post = await Post.findById(postId)

            if (!post) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Post not found'
                });
            }

            //check if not liked already
            if(!(post.likes.includes(userId)))
                {
                    post.likes.push(userId)
                    const notification = {
                        receiver : post.user,
                        sender :  userId,
                        content: "liked your post"
                    }
                   await Notification.create(notification)

                    await post.save({validateBeforeSave : false})

                    return res.status(200).json(
                        {
                            status: "success",
                            message : "Post liked Successfully"
                        }
                    )
                }
            else{
                await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
                return res.status(200).json(
                    {
                        status: "success",
                        message : "Post unliked Successfully"
                    })

            }

        }catch(error)
        {
            res.status(500).json({
                status: 'fail',
                message: 'Failed to like/unlike post'
            });
        }
    }


    exports.getLikes = async (req, res) =>
        {
            const postId = req.params.id
            
    
            try{
                const post = await Post.findById(postId).populate("likes", "name profilePic")
    
                if (!post) {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Post not found'
                    });
                }
    
                return res.status(200).json(
                    {
                        status: "success",
                        message : post.likes
                    })
    
            }catch(error)
            {
                res.status(500).json({
                    status: 'fail',
                    message: 'Failed to like/unlike post'
                });
            }
        }
    
    exports.isLiked = async (req,res) => 
        {
            const postId = req.params.id
            const userId = req.user.id
            try {
                const post = await Post.findById(postId);
                if (!post) {
                    return res.status(404).json({ status: 'fail', message: 'Post not found' });
                }
        
                const hasLiked = post.likes.includes(userId);
        
                res.status(200).json({
                    status: 'success',
                    hasLiked,
                });
            } catch (error) {
                res.status(500).json({
                    status: 'fail',
                    message: 'An error occurred while checking like status',
                    error: error.message,
                });
            }
        }           


    exports.getFeed = async (req, res) => 
        {
            const userId = req.user.id

            try{
                const user = await User.findById(userId)
                console.log(user)
                if (!user) {
                    return res.status(404).json({
                        status: "error",
                        message: 'User not found'
                     });
                }
                
                if (!Array.isArray(user.following) || user.following.length === 0) {
                    return res.status(200).json({
                        status: "success",
                        message: "No following users to fetch posts"
                    });
                }
                const posts = await Post.find({ user: { $in: user.following } })
                        .populate('user', 'name profilePic') // Include user details in each post
                        .sort({ createdAt: -1 }) 


                    res.status(200).json(
                        {
                            status: "success",
                            data: 
                            {
                                posts
                            }
                        }
                    )

            }catch(error){
                return res.status(404).json({
                    status: "error",
                    message: error.message
                 });
            }
        }