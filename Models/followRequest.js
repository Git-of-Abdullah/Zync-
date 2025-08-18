const mongoose = require("mongoose");

const FollowRequestSchema = new mongoose.Schema(
    {
        receiver: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        }, 
        
        sender: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        }, // The user who triggered the notification
        
        IsApproved: {
            type: Boolean,
            default: false,
        },
    },{timestamps: true}
);

const Notification = mongoose.model("Follow Request", FollowRequestSchema);

module.exports = Notification;
