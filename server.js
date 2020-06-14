var express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    mongoose = require('mongoose'),
    moment = require('moment'),
    path = require('path'),
    User = require("./models/user"),
    Room = require('./models/room'),
    Message = require('./models/message');


app = express();

var socket = require('socket.io');

var server = app.listen(3000, () => {
    console.log('Server has started...');
});

// app.use(express.static("public"));
app.use(express.static(path.join(__dirname + "/public")));
app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));
mongoose.connect("mongodb://localhost/mychatapp",{useNewUrlParser:true, useUnifiedTopology:true});

app.use(session({
    secret: 'This is a black cat',
    resave: false,
    saveUninitialized: false
}));

app.use((req,res,next) => {
    currentUser = req.session.username;
    currentUserId = req.session.userId;
    next();
}); 

var io = socket(server);
var myMap = new Map();
io.on('connection', (socket) => {
    socket.on('joinRoom',({roomname,userId}) => {
        myMap.set(socket.id,[currentUser,roomname,currentUserId]);
        socket.join(roomname);
        console.log(socket.id);
        // Welcome for current user
        socket.emit('chat message',{user:'ChatBot',msg:'Welcome to MyChatApp',time:moment().format('hh:mm A')});
        console.log(myMap.get(socket.id));
        //Broadcast when user has joined chat
        socket.broadcast.to(myMap.get(socket.id)[1]).emit('chat message',{user:'ChatBot',msg: currentUser + ' has joined chat',time:moment().format('hh:mm A')});
    
    })

    
   
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
                    console.log(foundRoom);
                    console.log(message);
                    foundRoom.messages.push(message._id);
                    foundRoom.save();
                }
            })
        });
    });

    //     //Runs when client disconnects
    // socket.on('disconnect', () => {
    //     io.to(myMap.get(socket.id)[1]).emit('chat message',{user:'ChatBot',msg: myMap.get(socket.id)[0] + ' has disconnected!',time:moment().format('hh:mm A')});
    // });
});
    

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/signup',(req,res) =>{
    res.render("signup");
});

app.post('/signup',(req,res,next) => {
    var newUser = new User({username:req.body.username});
    User.create(newUser,(err,user) => {
        if(err){
            console.log(err);
        } else{
            req.session.loggedIn = true;
            req.session.userId = user._id;
            req.session.username = user.username;
            res.redirect('/index');
        }
    });
    
});

app.get('/index',isLoggedIn,(req,res) => {
    Room.find({}, (err,foundRoom) => {
        if(err){
            console.log(err);
        } else{
            res.render('index',{rooms:foundRoom});
        }
    })
    
});

app.get('/room',isLoggedIn,(req,res) => {
    res.render('room',{id:currentUserId});
});

app.post('/room',isLoggedIn,(req,res) => {
    var newRoom = new Room({roomname:req.body.roomname});
    Room.create(newRoom,(err,room) => {
        if(err) console.log(err);
        else{
            room.users.push(currentUserId);
            room.save();
            res.redirect('/room/'+room._id);
        }
    })
    
});

app.get('/room/:roomid',isLoggedIn,(req,res) => {
    Room.findById(req.params.roomid).populate('users').populate('messages').exec((err,room) => {
        if(err) console.log(err);
        else{
            var foundUser = room.users.find(element => element._id == currentUserId);
            if(!foundUser){
                console.log(room);
                res.render('chat',{isJoined:false,room:room,userId:currentUserId});
                
            }else{
                console.log(room);
                res.render('chat',{isJoined:true,room:room,userId:currentUserId});
                
            }
        }
    })
    
    
});

app.get('/room/:roomid/joinchat',isLoggedIn,(req,res) => {
    Room.findById(req.params.roomid, (err,foundRoom) => {
        if(err) console.log(err);
        else{
            foundRoom.users.push(currentUserId);
            foundRoom.save();
            res.redirect('/room/'+req.params.roomid);
        }
    })
})

app.get('/room/:roomid/:userId/leave',isLoggedIn,(req,res) => {
    Room.findById(req.params.roomid,(err,foundRoom) => {
        if(err) console.log(err);
        else{
            const index = foundRoom.users.indexOf(req.params.userId);
            if (index > -1) {
                foundRoom.users.splice(index, 1);
            }
            foundRoom.save();
            res.redirect('/index');
        }
    })
})


app.get('/logout',(req,res) => {
    req.session.loggedIn = false;
    req.session.username = undefined;
    req.session.userId = undefined;
    res.redirect('/');
});

function isLoggedIn(req,res,next){
    if(req.session.loggedIn){
        return next();
    }
    res.redirect("/signup");
}


