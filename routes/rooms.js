var express = require("express");
var router = express.Router();
var Room = require('../models/room');
var Bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');


router.get('/index',isLoggedIn,(req,res) => {
    Room.find({}, (err,foundRoom) => {
        if(err || !foundRoom){
            res.redirect('/home');
        } else{
            res.render('index',{rooms:foundRoom});
            
        }
    })
    
});

router.get('/room',isLoggedIn,(req,res) => {
    res.render('room');
});

router.post('/room',isLoggedIn,(req,res) => {
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

router.get('/room/:roomid',isLoggedIn,(req,res) => {
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

router.get('/joinPrivate',isLoggedIn, (req,res) => {
    res.render('privateRoom');
})

router.post('/joinPrivate',isLoggedIn, (req,res) => {
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

router.get('/room/:roomid/joinchat',isLoggedIn,(req,res) => {
    Room.findById(req.params.roomid, (err,foundRoom) => {
        if(err || !foundRoom) res.redirect('/index');
        else{
            foundRoom.users.push(currentUserId);
            foundRoom.save();
            res.redirect('/room/'+req.params.roomid);
        }
    })
})

router.get('/room/:roomid/:userId/leave',isLoggedIn,(req,res) => {
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
});

function isLoggedIn(req,res,next){
    if(req.session.loggedIn){
        return next();
    }
    res.redirect("/login");
}

module.exports = router;