//jshint esversion:6
//import 'dotenv/config'
import ejs from "ejs";
import express from "express"; ``
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';

const app = express()

app.use(express.static("public"))// The express.static middleware function is used to expose a directory or a file to a particular URL so its contents can be publicly accessed. In this case, the assets directory is exposed to the /assets URL.
app.set('view engine', 'ejs')//View engines allow us to render web pages using template files. 
app.use(bodyParser.urlencoded({ extended: true }))

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
    password: String
});

userSchema.plugin(passportLocalMongoose)

const user = new mongoose.model("User", userSchema)
passport.use(user.createStrategy());

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.get("/", function (req, res) {
    res.render("home")

})

app.get("/login", function (req, res) {
    res.render("login")
})

app.get("/register", function (req, res) {
    res.render("register")
})

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

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