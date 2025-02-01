const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
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
        
        content: {
            type: String,
            required:[true, "notification content is required"]
        }
    },{timestamps: true}
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
