//jshint esversion:6
require('dotenv').config(); // ENVIRONMENT CONFIG MUST BE REQUIRED AT THE TOP OF THE PAGE ///
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
const md5 = require("md5");
// const bcrypt = require('bcrypt'); // adding salt rounds to hashed passwords using bcrypt
// const saltRounds = 10;

//Learning how to create a web browsing session + cookies with passport
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));
//set up the session first
app.use(session({
    secret: "password",
    resave: false,
    saveUninitialized: false
}));

//now we can initialize passport to handle our session

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true})
mongoose.set("useCreateIndex", true);


const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    //adding in a new field to auth users with google
    googleId: String,
    secret: String
});


//finally, we add in the passportlocalmongoose plugin to hash and salt user's passwords
userSchema.plugin(passportLocalMongoose);

userSchema.plugin(findOrCreate);


// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']}); level 1: this will encrypt only our password


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());


//using the passport local mongoose package to serialize/deserialize our users
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});
  
passport.deserializeUser(function(id, cb) {
    User.findById(id, function(err, user) {
      cb(err, user);
    });
});


//using google Oauth to authenticate users

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
         return cb(err, user);
    });
  }
));





app.get("/", function(req, res){
    res.render('home')
})



app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);



app.get("/auth/google/secrets", 
    passport.authenticate('google', {failureRedirect: "/login" }), 
    function(req, res){
    //if auth is successfull, we redirect to the secrets GET route
    res.redirect("/secrets")
});


app.get("/login", function(req, res){
    res.render('login')
});


app.get("/register", function(req, res){
    res.render('register')
});


app.get("/secrets", function(req, res){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
        if (err) {
            console.log(err);
        } else {
            if (foundUsers) {
                res.render("secrets", {usersWithSecrets: foundUsers})
            }
        }
    })
});


app.get("/submit", function(req, res){
    if (req.isAuthenticated()) {
        res.render("submit");

    } else {
        res.redirect("/login")
    }
})
// we need to logout the user and redirect them to the home page
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
})

app.post('/register', function(req, res){
    
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect('/register')

        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect('/secrets')
            })
        }
    })



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
    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect('/secrets')
            })
        }
    })
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

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    console.log(req.user.id);

    User.findById(req.user.id, function(err, foundUser){
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets")
                })
            }
        }
        
    })
})

app.listen(3000, function(){
    console.log("Successfully started server on port 3000");
})