const User = require('../Models/userModel')
const Post = require("../Models/postModel")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const util = require("util")
const nodemailer = require("nodemailer")
const cloudinary = require("../utils/cloudinaryConfig")
const Notification = require('../Models/notificationModel')
const  StreamChat = require("stream-chat").StreamChat;


const signToken = (id) => 
    {
        return  jwt.sign({id}, process.env.SECRET_STRING, { expiresIn: process.env.EXPIRES_IN})
    }


    exports.authenticate = async(req,res, next) => 
        {
            //1. check if auth header exist
            const  authHeader = req.headers.authorization
            let token;

            if(authHeader && authHeader.startsWith("bearer"))
                {
                     token = authHeader.split(" ")[1];
                }

                if(!token)
                    {
                        return res.status(400).json(
                            {
                                error: 'No Auth token',
                                message: "please Login"
                            }
                        )
                    }
            //2. check if token is matched===========================================
            let decodedToken;
            try{
                 decodedToken = await util.promisify(jwt.verify)( token, process.env.SECRET_STRING)
            }
            catch(error)
            {
                return res.status(400).json({
                    error : error,
                    message: "jwt error"
    
                })
            }
                   
            
                    

            //3. check if user still exists
            let user;
            try{
                 user = await User.findById( decodedToken.id )
                 req.user = user
            }catch(error)
            {  
                console.log(error)
                return res.status(400).json({
                error : error,
                message: "Error in querying user"

            })}
            if(!user)
                {
                    return res.status(400).json({
                        error : "User not found in Database",
                        message: " user Doesnt exist in database"
        
                    })

                }
                


            //4. check if pswd is not changed after jwt was issued
                if(user.isPasswordChanged(decodedToken.iat) === true)
                    {
                        return res.status(400).json({
                            error : "User Password Changed",
                            message: "Please login again"
            
                        })
                    }

            //5. grant access

            next();
        }



exports.signup = async(req,res) =>
    {
        req.body.profilePic = process.env.DEF_PROFILE_PIC
        try{ 

            const user = await User.create(req.body)

            const token = signToken(user._id)


            res.status(201).json(
                {
                    status: "success",
                    data: 
                    {
                        token
                    }
                }
            )
        }catch(error)
        {
            res.status(400).json(
                {
                    status: "fail",
                    message: "Email is already in use. Please use a different email."
                  
                })

        }
        

    }


    exports.getStreamToken = async(req,res) =>
    {
        try{

            const userId = req.user.id;
            const key = process.env.STREAM_KEY
            const secret = process.env.STREAM_SECRET
    
            if(!(userId))
                {
                    return res.status(401).json(
                        {
                            status: "error",
                            message: "Unauthorized"
                        }
                    )
                }
            
            const serverClient = StreamChat.getInstance(key,secret)
    
            const chatToken = serverClient.createToken(userId.toString())
    
            res.status(200).json({
                status: "success",
                token : chatToken
            })
        }catch(error)
        {
            res.status(500).json({
                status: "error",
                message: error.message
            })
        }


        

        
    }

exports.login = async(req,res) =>
    {
        const mail = req.body.email;
        const password = req.body.password;

        //check if mail and passwords are given
        if(!mail || !password)
            {
                return res.status(404).json({
                    status: "error 400",
                    message: "please provide email and password"
                })
            }

        //check if user with this mail exists in db and password is matched
        try{
            const user = await User.findOne({ mail }).select('+password')
            // console.log(user);
            // console.log(password);


            if(!user)// await !user.matchPasswords(password, user.password))
                {
                   return res.status(404).json(
                        {
                            status: 400,
                            message: 'User Doesnt Exist',
                            
                        }
                    )
                }
                
                if(!(await bcrypt.compare(password, user.password)))
                    {
                        
                        return res.status(404).json(
                            {
                                status: 400,
                                message: 'Passwords dont match',
                                
                            }
                        )

                    }

                //generate token if all checks are passed and send it to response

                const token = signToken(user._id)
                // console.log(token)

            res.status(200).json(
                {
                    status: 200,
                    message: 'success',
                    token
                }
            )
        }
        catch(error)
        {
            res.status(404).json(
                {
                    status: 400,
                    message: error.message
                }
            )

        }

    }

exports.forgotPassword = async (req, res) =>
{
   const mail = req.body.mail;
   let url = "";
   //1 Check if mail is provided
   if(!mail) return res.status(400).json(
    {
        status : 'failed',
        message : 'please Provide the mail'
    }
   )

   try{
    //2 Check if user of this mail exists
    const user = await User.findOne({mail})

    if(!user){
        return res.status(404).json(
            {
                status : 'failed',
                message : "Gmail Doesn't Exist "
            }
        )
    }
    //3. Assign token
    const token = jwt.sign({mail}, process.env.RESET_SECRET_STR, {expiresIn: process.env.RESET_EXPIRES_IN})
    //4. Generate URL

    url = `${process.env.RESET_URL}/resetPassword/${token}`

    //5. Send the url through the mail

    const transporter = nodemailer.createTransport(
        {
            service : 'gmail',
            secure: true,
            auth : 
            {
                user: process.env.MAIL_USER,
                pass : process.env.MAIL_PASS
            }
        }
    )

    const reciever = 
    {
        from : "zync@gmail.com",
        to : `${mail}`,
        subject : "Reset Password Request",
        text:` Reset Your Password by Clicking on the link : ${url}`   
    }

    await transporter.sendMail(reciever);

    res.status(200).json(
        {
            status : 'successful',
            message: "Check Your gmail To reset your Password"
        }
    )



   }catch(error){

    return res.status(400).json({
        status : "error",
        message : error
    })

   }

}


exports.resetPassword = async(req,res) =>
    {
        const token = req.params.token
        const pswd = req.body.password
        const cnfrmPswd = req.body.confirmPassword
        console.log(token)

       // 1. verify the token
        let decoded;
        let mail;
        try{
            decoded = await util.promisify(jwt.verify)(token, process.env.RESET_SECRET_STR)
            if(!decoded)
                {
                    return res.status(400).json(
                        {
                            status: 'error',
                            message : "JWT verification error occured, incorrect jwt"
                        }
                    )
                }
                mail = decoded.mail
        //2. check if pswd and cnfrmpswd match
        if(pswd !== cnfrmPswd)
            {
                return res.status(400).json(
                    {
                        status: 'error',
                        message : "Password and Confirm Password Doesnt Match"
                    }
                )
            }

            //3. fetch user
            console.log(mail)
            const user =  await User.findOne({mail})
            //4. update password
            user.password = pswd
            user.passwordChangedAt = Date.now()
            //5. save password
            await user.save({validateBeforeSave: false})


            res.status(200).json(
                {
                    status : "successful",
                    message: "Password Updated Successfully"
                }
            )
            //------------------------------------------
        } catch(error){
            return res.status(400).json(
                {
                    status: 'error',
                    message : "JWT verification error occured"
                }
            )
        }
    }

//Updating user info
exports.updateUser = async (req, res) => {
    const id = req.user.id;
    // 1. Get data from req
    const updates = req.body;
    const allowedFields = ["name", "mail", "bio", "profilePic"];
    const updateKeys = Object.keys(updates); // Fetch keys from update object

    // 2. Check if updation is allowed
    const isValidOperation = updateKeys.every((key) =>
        allowedFields.includes(key)
    );

    if (!isValidOperation) {
        return res.status(400).json({
            status: 'error',
            message: "Update operation is not allowed",
        });
    }

    // Handle uploaded file for profilePic
    

    try {
        // Update the user
        const user = await User.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        res.status(201).json({
            status: 'successful',
            message: "User updated",
            user,
        });
    } catch (error) {
        res.status(400).json({
            status: 'Failed to update user',
            message: error.message,
        });
    }
};

exports.updatepfp = async (req, res) => {
    const id = req.user.id;
    let url;

    if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: "Zync" });
        url = result.url
    } else {
        return res.status(400).json(
            {
                status: "error",
                message: "please choose a file"
            }
        )
    }
    

    // Handle uploaded file for profilePic
    

    try {
        // Update the user
        const user = await User.findByIdAndUpdate(id, {profilePic : url}, {
            new: true,
            runValidators: true,
        });

        res.status(201).json({
            status: 'successful',
            message: "User updated",
            user,
        });
    } catch (error) {
        res.status(400).json({
            status: 'Failed to update user',
            message: error.message,
        });
    }
};


exports.getUserById = async(req,res) =>
    {
        const id = req.params.id
        console.log(id)

        try
        {
            const user = await User.findById(id).select("-password")
            if(!user)
                {
                   return  res.status(404).json(
                        {
                            status : 'error',
                            message : "User not found"
                        }
                    )
                }

                return res.status(200).json(
                    {
                        status : 'successfull',
                        data :{
                            user
                        }
                    }
                )
            
        }catch(error)
        {
            res.status(400).json(
                {
                    status : 'Failed to Find User',
                    message : error
                })
        }
    }


    exports.getProfile = async(req,res) =>
        {
            const id = req.params.id
            
    
            try
            {
                const user = await User.findById(id).select("-password")
                const posts = await Post.find({user : user._id})
                console.log(posts);
                if(!user)
                    {
                       return  res.status(404).json(
                            {
                                status : 'error',
                                message : "User not found"
                            }
                        )
                    }
    
                    return res.status(200).json(
                        {
                            status : 'successfull',
                            data :{
                                user,
                                posts
                            }
                        }
                    )
                
            }catch(error)
            {
                res.status(400).json(
                    {
                        status : 'Failed to Find User',
                        message : error
                    })
            }
        }

//=================Follow and Unfollow Users ========================================
exports.followUser = async(req,res) => 
    {
        const loggedUserId = req.user.id
        const targetUserId = req.params.id
       

        try{
            const loggedUser = await User.findById(loggedUserId)
            const targetUser = await User.findById(targetUserId)
           

            if(!targetUser)
                {
                    return res.status(404).json(
                        {
                            message : 'Failed to Find User with the provided id',
                            status : "Failed to follow"
                        })
                }
            if(loggedUser.following.includes(targetUserId))
                {
                    return res.status(400).json(
                        {
                            message : 'Already Following the user',
                            status: "Failed to follow"
                        })
                }

                loggedUser.following.push(targetUserId);
                targetUser.followers.push(loggedUserId);
                await loggedUser.save({validateBeforeSave: false});
                await targetUser.save({validateBeforeSave: false});
                const notification = {
                    receiver : targetUser._id,
                    sender :   loggedUser._id,
                   content: "Started following you"
                }
              await Notification.create(notification)

            res.status(200).json(
                {
                    status : "successful",
                    message : "Followed the user successfully"
                }
            )

        }catch(error)
        {
            res.status(400).json(
                {
                    status : "failed",
                    message : error
                }
            )

        }
    }

    //unfollow function

    exports.unfollowUser = async(req,res) => 
        {
            const loggedUserId = req.user.id
            const targetUserId = req.params.id
            
    
            try{
                const loggedUser = await User.findById(loggedUserId)
                const targetUser = await User.findById(targetUserId)
              
    
                if(!targetUser)
                    {
                        return res.status(404).json(
                            {
                                message : 'Failed to Find User with the provided id',
                                status : "Failed to unfollow"
                            })
                    }
                if(!(loggedUser.following.includes(targetUserId)))
                    {
                        return res.status(400).json(
                            {
                                message : 'Not Following the user',
                                status: "Failed to unfollow"
                            })
                    }
    
                    loggedUser.following = loggedUser.following.filter(id => id.toString() !== targetUserId);
                    targetUser.followers = targetUser.followers.filter(id => id.toString() !== loggedUserId);
                    await loggedUser.save({validateBeforeSave: false});
                    await targetUser.save({validateBeforeSave: false});
    
                res.status(200).json(
                    {
                        status : "successful",
                        message : "unFollowed the user successfully"
                    }
                )
    
            }catch(error)
            {
                res.status(400).json(
                    {
                        status : "failed",
                        message : error
                    }
                )
    
            }
        }



        exports.getFollowers = async (req,res) => 
            {
                const id = req.params.id
                try 
                {
                    const user = await User.findById(id).populate("followers","name profilePic")

                    if(!user)
                        {
                            return  res.status(400).json(
                                {
                                    status : "Failed",
                                    message : "Failed to find the user"
                                }
                            )
                        }

                    res.status(200).json(
                        {
                            status : "success",
                            data : 
                            {
                                followers : user.followers
                            }
                        }
                    )
                }catch(error)
                {
                    res.status(400).json(
                        {
                            status : "failed to get followers",
                            message : error
                        }
                    )
        
                }
            }

            exports.getFollowing = async (req,res) => 
                {
                    const id = req.params.id
                    try 
                    {
                        const user = await User.findById(id).populate("following","name profilePic")
    
                        if(!user)
                            {
                                return  res.status(400).json(
                                    {
                                        status : "Failed",
                                        message : "Failed to find the user"
                                    }
                                )
                            }

                            res.status(200).json(
                                {
                                    status : "success",
                                    data : 
                                    {
                                        user
                                    }
                                }
                            )
                    }catch(error)
                    {
                        res.status(400).json(
                            {
                                status : "failed to get following users",
                                message : error
                            }
                        )
            
                    }
                }

 exports.getNotifications = async(req,res) =>
 {
    const userId = req.user.id
    try{
       
    const notifications = await Notification.find({receiver : userId}) 
    .populate('sender', 'name profilePic')  // Populating sender's username and pfp
    .populate('receiver', 'name profilePic')
    .sort({ createdAt: -1 })

    if(!notifications)
        {
            return res.status(404).json(
                {
                    status: "success",
                    message: "No notifications for user"
                }
            )
        }

    return res.status(200).json(
        {
            status: "success",
            data: 
            {
                notifications
            }
        }
    )

    }catch(error)
    {
        res.status(500).json(
            {
                status: "failed",
                message: error.message 
            }
        )
    }
    
 }