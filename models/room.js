var mongoose = require("mongoose");

var roomSchema = new mongoose.Schema({
    roomname:String,
    users:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    messages:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    }]
});

module.exports = mongoose.model("Room",roomSchema);