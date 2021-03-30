//jshint esversion:6
require('dotenv').config(); // ENVIRONMENT VARIABLES MUST BE REQUIRED AT THE TOP OF THE PAGE ///
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
const md5 = require("md5");
// const bcrypt = require('bcrypt'); // adding salt rounds to hashed passwords using bcrypt
// const saltRounds = 10;

//Learning how to create a web browsing session + cookies
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(session({
    secret: "password",
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());






mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true})
mongoose.set("useCreateIndex", true);


const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);



// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']}); level 1: this will encrypt only our password


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
    res.render('home')
})


app.get("/login", function(req, res){
    res.render('login')
})


app.get("/register", function(req, res){
    res.render('register')
})




app.post('/register', function(req, res){
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash){
    //     const newUser = new User({
    //         email: req.body.username,
    //         // password: md5(req.body.password) //use the md5 package to turn our password into a hash
    //         password: hash // using bcrypt now to add salt rounds to the hash
    //     })
    //     newUser.save(function(err){
    //         if (err) {
    //             console.log(err);
    //         } else {
    //             res.render("secrets"); 
    //         }
    //     })
    // })
    
})


app.post('/login', function(req,res){
    // const username = req.body.username;
    // // const password = md5(req.body.password);
    // const password = req.body.password;

    // User.findOne({email: username}, function(err, foundUser){
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         if (foundUser) {
    //              bcrypt.compare(password, foundUser.password, function(err, result){
    //                 if (result === true) {
    //                     res.render("secrets")        
    //                 }
    //              })
                
    //             }
    //         }
    // }); 
});



app.listen(3000, function(){
    console.log("Successfully started server on port 3000");
})