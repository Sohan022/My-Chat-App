var express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    mongoose = require('mongoose'),
    moment = require('moment'),
    User = require("./models/user");


app = express();

var socket = require('socket.io');

var server = app.listen(3000, () => {
    console.log('Server has started...');
});

app.use(express.static("public"));
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
    next();
}); 

var io = socket(server);
var myMap = new Map();
io.on('connection', (socket) => {
    myMap.set(socket.id,currentUser);
    // Welcome for current user
    socket.emit('chat message',{user:'ChatBot',msg:'Welcome to MyChatApp',time:moment().format('hh:mm A')});

    //Broadcast when user has joined chat
    socket.broadcast.emit('chat message',{user:'ChatBot',msg: currentUser + ' has joined chat',time:moment().format('hh:mm A')});

    //Chat messages
    socket.on('chat message', (msg) => {
        io.emit('chat message',{user:myMap.get(socket.id),msg:msg,id:socket.id,time:moment().format('hh:mm A') });
    });

        //Runs when client disconnects
    socket.on('disconnect', () => {
        io.emit('chat message',{user:'ChatBot',msg: myMap.get(socket.id) + ' has disconnected!',time:moment().format('hh:mm A')});
    });
});
    

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/index',isLoggedIn,(req,res) => {
    res.render('index');
    currentUser = req.session.username;
});

app.get('/signup',(req,res) =>{
    res.render("signup");
});

app.post('/signup',(req,res,next) => {
    req.session.loggedIn = true;
    req.session.username = req.body.name;
    res.redirect('/index');
});

app.get('/logout',(req,res) => {
    req.session.loggedIn = false;
    req.session.username = undefined;
    res.redirect('/');
});

function isLoggedIn(req,res,next){
    if(req.session.loggedIn){
        return next();
    }
    res.redirect("/signup");
}


