var express = require("express");
var router = express.Router();
var User = require('../models/user');
var Bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');

router.get('/', (req, res) => {
    res.render('home');
});

router.get('/signup',(req,res) =>{
    res.render("signup");
});

router.post('/signup',(req,res,next) => {
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

router.get('/login',(req,res) => {
    res.render('login');
});

router.post('/login',(req,res) => {
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
});

router.get('/logout',(req,res) => {
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

module.exports = router;