var mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
    text:String,
    time:String,
    author:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String
    },
});

module.exports = mongoose.model("Message",messageSchema);