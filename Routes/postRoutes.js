
const express = require('express')
const postController = require('../Controllers/postControllers')

const userController = require("../Controllers/userControllers")
const upload = require("../utils/multer")

const router = express.Router();


router.get('/',userController.authenticate, postController.getAllPosts) //zync/api/posts
router.get("/feed", userController.authenticate, postController.getFeed)
router.get('/:id',userController.authenticate, postController.getPostById)

router.post('/',userController.authenticate,upload.array('media', 3), postController.createPost) //zync/api/posts
router.put('/:id',userController.authenticate, postController.changePost)
router.patch('/:id',userController.authenticate, postController.changePost)


router.delete('/:id',userController.authenticate, postController.deletePost)

//likes routes

router.post("/:id/like", userController.authenticate, postController.likePost)
router.get("/:id/like", userController.authenticate, postController.getLikes)
router.get("/:id/liked", userController.authenticate, postController.isLiked)




module.exports = router