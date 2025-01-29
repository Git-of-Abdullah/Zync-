const userController = require("../Controllers/userControllers")
const commentController = require("../Controllers/commentControllers")
const express = require("express")
const router = express.Router()


router.post("/:id", userController.authenticate, commentController.postComment)
router.get("/:id", userController.authenticate, commentController.getComments)
router.patch("/:id", userController.authenticate, commentController.updateComments)
router.delete("/:id", userController.authenticate, commentController.deleteComments)
//replies
router.post("/:id/replies", userController.authenticate, commentController.createReply)
router.get("/:id/replies", userController.authenticate, commentController.getReplies)


module.exports = router