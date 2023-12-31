//jshint esversion:6
import 'dotenv/config'
import ejs from "ejs";
import express from "express"; ``
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import GoogleStrategy from 'passport-google-oauth20';
import findOrCreate from 'mongoose-findorcreate';


const app = express()

app.use(express.static("public"))// The express.static middleware function is used to expose a directory or a file to a particular URL so its contents can be publicly accessed. In this case, the assets directory is exposed to the /assets URL.
app.set('view engine', 'ejs');//View engines allow us to render web pages using template files. 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1/userDB", { useNewUrlParser: true, useUnifiedTopology: true })

const userSchema = new mongoose.Schema({ // set new mongoose schema for encryption
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate);

const user = new mongoose.model("User", userSchema)

passport.use(user.createStrategy());

passport.serializeUser(function (user, done) { done(null, user) });
passport.deserializeUser(function (user, done) { done(null, user) });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        user.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", function (req, res) {
    res.render("home")

})

app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect("/secrets");
    });

app.get("/login", function (req, res) {
    res.render("login")
})

app.get("/register", function (req, res) {
    res.render("register")
})
////////////////////////////////////////////////////////////////////


app.get("/secrets", async function (req, res) {
    try {
        await user.find({ "secret": { $ne: null }}).then(function (foundUsers,err) {
            res.render("secrets", { usersWithSecrets: foundUsers });
        })
    }
    catch (err) {
        console.log(err)
    }
});

app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", async function (req, res) {
    const submittedSecret = req.body.secret;

    //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
    // console.log(req.user.id);

    await user.findById(req.user._id).then(function (foundUser, err) {
        try {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save().then(function () {
                    res.redirect("/secrets");
                })

            }
            else {
                throw ("this is" + err)
            }
        }
        catch (err) {
            console.log(err)
        }
    });



});

/////////////////////////////////////////////////////////////////////////////////////////////
app.get('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////

app.post("/register", function (req, res) {

    user.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});

///////////////////////////////////////////////////////////////////////////

app.post("/login", function (req, res) {

    const User = new user({
        username: req.body.username,
        password: req.body.password
    });

    req.login(User, function (err) { // res.login from passport .
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});

app.listen("3000", function () {

    console.log("server start")

})