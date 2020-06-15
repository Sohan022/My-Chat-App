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
    

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/signup',(req,res) =>{
    res.render("signup");
});

app.post('/signup',(req,res,next) => {
    User.findOne({username:req.body.username}, (err,foundUser) => {
        if(err){
            req.flash('error',"Technical Issue, Try after sometime!");
            res.redirect('/signup');
        } else if(foundUser){
            req.flash("error","This Username is already associated with other user.");
            res.redirect('/signup');
        } else{
            req.body.password = Bcrypt.hashSync(req.body.password, 10);
            var newUser = new User({username:req.body.username,password:req.body.password});
            User.create(newUser,(err,user) => {
                if(err){
                    req.flash('error',"Technical Issue, Try after sometime!");
                    res.redirect('/signup');
                } else{
                    req.session.loggedIn = true;
                    req.session.userId = user._id;
                    req.session.username = user.username;
                    res.redirect('/index');
                }
            });
        }
    });
});

app.get('/login',(req,res) => {
    res.render('login');
});

app.post('/login',(req,res) => {
    User.findOne({ username: req.body.username }, (err, user) => {
        if(err){
            req.flash('error',"Technical Issue, Try after sometime!");
            res.redirect('/login');
        } else if(!user || !Bcrypt.compareSync(req.body.password, user.password)){
            req.flash('error','Username or Password Wrong!');
            res.redirect('/login');
        } else{
            req.session.loggedIn = true;
            req.session.userId = user._id;
            req.session.username = user.username;
            res.redirect('/index');
        }
    });
})

app.get('/index',isLoggedIn,(req,res) => {
    Room.find({}, (err,foundRoom) => {
        if(err || !foundRoom){
            res.redirect('/home');
        } else{
            res.render('index',{rooms:foundRoom});
            
        }
    })
    
});

app.get('/room',isLoggedIn,(req,res) => {
    res.render('room');
});

app.post('/room',isLoggedIn,(req,res) => {
    Room.findOne({roomname:req.body.roomname}, (err,foundRoom) => {
        if(err){
            req.flash('error',"Technical Issue, Try after sometime!");
            res.redirect('/room');
        }else if(foundRoom){
            req.flash('error','This Room Name is already used!');
            res.redirect('/room');
        } else{
            if(req.body.isPublic == "public"){
                var newRoom = new Room({roomname:req.body.roomname,isPublic:req.body.isPublic});
            } else{
                req.body.roompass = Bcrypt.hashSync(req.body.roompass, 10);
                var newRoom = new Room({roomname:req.body.roomname,isPublic:req.body.isPublic,roompass:req.body.roompass});
            }
            
            Room.create(newRoom,(err,room) => {
                if(err){
                    req.flash('error',"Technical Issue, Try after sometime!");
                    res.redirect('/room');
                }else{
                    room.users.push(currentUserId);
                    room.save();
                    res.redirect('/room/'+room._id);
                }
            })
        }
    })
    
    
});

app.get('/room/:roomid',isLoggedIn,(req,res) => {
    Room.findById(req.params.roomid).populate('users').populate('messages').exec((err,room) => {
        if(err || !room) res.redirect('/index');
        else{
            var foundUser = room.users.find(element => element._id == currentUserId);
            if(!foundUser){
                res.render('chat',{isJoined:false,room:room,userId:currentUserId});
                
            }else{
                res.render('chat',{isJoined:true,room:room,userId:currentUserId});
                
            }
        }
    })  
    
});

app.get('/joinPrivate',isLoggedIn, (req,res) => {
    res.render('privateRoom');
})

app.post('/joinPrivate',isLoggedIn, (req,res) => {
    Room.findOne({roomname:req.body.roomname}, (err,foundRoom) => {
        if(err){
            req.flash('error',"Technical Issue, Try after sometime!");
            res.redirect('/joinPrivate');
        }else if(!foundRoom || !Bcrypt.compareSync(req.body.roompass, foundRoom.roompass)){
            req.flash('error','Room Name or Room Password Wrong!');
            res.redirect('/joinPrivate');
        } else{
            foundRoom.users.push(currentUserId);
            foundRoom.save();
            res.redirect('/room/'+foundRoom._id);
        }
    })
})

app.get('/room/:roomid/joinchat',isLoggedIn,(req,res) => {
    Room.findById(req.params.roomid, (err,foundRoom) => {
        if(err || !foundRoom) res.redirect('/index');
        else{
            foundRoom.users.push(currentUserId);
            foundRoom.save();
            res.redirect('/room/'+req.params.roomid);
        }
    })
})

app.get('/room/:roomid/:userId/leave',isLoggedIn,(req,res) => {
    Room.findById(req.params.roomid,(err,foundRoom) => {
        if(err || !foundRoom) res.redirect('/index');
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
    res.redirect("/login");
}


