const express = require('express')
const userController = require('../Controllers/userControllers')

const router = express.Router()
const upload = require("../utils/multer")


router.get("/notifications",userController.authenticate, userController.getNotifications )
router.post('/signup', userController.signup)
router.post('/login', userController.login)
router.post('/forgotPassword', userController.forgotPassword)
router.post("/resetPassword/:token", userController.resetPassword)
router.patch('/updateUser', userController.authenticate, userController.updateUser)
router.patch('/updatePfp', userController.authenticate,upload.single("profilePic"), userController.updatepfp)
router.get('/getUserById/:id', userController.authenticate, userController.getUserById)
router.get('/getProfile/', userController.authenticate, userController.getProfile)
router.post("/follow/:id",userController.authenticate, userController.followUser )
router.post("/unfollow/:id",userController.authenticate, userController.unfollowUser )
router.get("/followers/:id", userController.authenticate, userController.getFollowers )
router.get("/following/:id", userController.authenticate, userController.getFollowing )

router.get("/getStreamToken", userController.authenticate, userController.getStreamToken)

module.exports = router;