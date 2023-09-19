//jshint esversion:6
import ejs from "ejs";
import express from "express"; ``
import bodyParser from "body-parser";
import mongoose from "mongoose";
//import encrypt from 'mongoose-encryption'; 

const app = express()


app.use(express.static("public"))// The express.static middleware function is used to expose a directory or a file to a particular URL so its contents can be publicly accessed. In this case, the assets directory is exposed to the /assets URL.
app.set('view engine', 'ejs')//View engines allow us to render web pages using template files. 
app.use(bodyParser.urlencoded({ extended: true }))


mongoose.connect("mongodb://127.0.0.1/userDB", { useNewUrlParser: true })

const userSchema = new mongoose.Schema({ // set new mongoose schema for encryption
    email: String,
    password: String
});

const secret ="abcdefghijklmnopqrstuvwxyz"
userSchema.plugin(encrypt,{secret:secret,encryptedField:['password']}) // use encryptedfield to specife which field you like to 

const user = new mongoose.model("User", userSchema)

app.get("/", function (req, res) {
    res.render("home")

})

app.get("/login", function (req, res) {
    res.render("login")
})

app.get("/register", function (req, res) {
    res.render("register")
})

app.post("/register", function (req, res) {
    const newUser = new user({
        email: req.body.username,
        password: req.body.password
    })
    newUser.save()
    res.render("secrets")
})

app.post("/login", async function (req, res) {

    const name = req.body.username
    const pass = req.body.password

    user.findOne({ email: name }).then(( founduser) => {
   
        if(founduser){
            if(founduser.password===pass){
                res.render("secrets")
            }
        }

      
    })
})

















app.listen("3000", function () {
    console.log("server start")


})