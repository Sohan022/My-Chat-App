var express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    mongoose = require('mongoose'),
    moment = require('moment'),
    path = require('path'),
    Bcrypt = require('bcryptjs'),
    flash = require('connect-flash'),
    User = require("./models/user"),
    Room = require('./models/room'),
    Message = require('./models/message'),
    indexRoutes = require('./routes/index');
    roomRoutes = require('./routes/rooms');


app = express();

var socket = require('socket.io');

app.use(express.static(path.join(__dirname + "/public")));
app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(flash());
mongoose.connect("mongodb://localhost/mychatapp",{useNewUrlParser:true, useUnifiedTopology:true});

app.use(session({
    secret: 'This is a black cat',
    resave: false,
    saveUninitialized: false
}));

app.use((req,res,next) => {
    currentUser = req.session.username;
    currentUserId = req.session.userId;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
}); 

var io = socket(server);
var myMap = new Map();
io.on('connection', (socket) => {
    socket.on('joinRoom',({roomname,userId}) => {
        myMap.set(socket.id,[currentUser,roomname,currentUserId]);
        socket.join(roomname);
    });

    //Chat messages
    socket.on('chat message', (msg) => {
        io.to(myMap.get(socket.id)[1]).emit('chat message',{user:myMap.get(socket.id)[0],msg:msg,id:socket.id,time:moment().format('hh:mm A') });
        var newMsg = new Message({text:msg,time:moment().format('hh:mm A')});
        Message.create(newMsg, (err,message) => {
            message.author.id = myMap.get(socket.id)[2];
            message.author.username = myMap.get(socket.id)[0];
            message.save();

            Room.findOne({roomname:myMap.get(socket.id)[1]}, (err,foundRoom) => {
                if(err) console.log(err);
                else{
                    foundRoom.messages.push(message._id);
                    foundRoom.save();
                }
            })
        });
    });
});
    
app.use(indexRoutes);
app.use(roomRoutes);

var server = app.listen(3000, () => {
    console.log('Server has started...');
});
