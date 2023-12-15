const express = require("express");
const app = express();
const path = require("path");
const userModel = require("./models/UserSchema");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const multer = require("multer");
require("dotenv").config();
const nocache = require("nocache");
const crypto = require("crypto");

const indexRouter = require("./routes/admin");
const usersRouter = require("./routes/users");
const otpRouter = require("./routes/otpRoute");

//view engine setup
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(nocache());


//ssession secret Key
const sessionKey = crypto.randomBytes(16).toString("hex");
//console.log(sessionKey);

app.use(
  session({
    secret: process.env.SESSION_SECRET || sessionKey,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 60 * 60 * 1000, //set the cookie for one hour
    },
  })
);

app.use(cookieParser());

mongoose
  .connect("mongodb://127.0.0.1:27017/New_Project")
  .then(() => {
    console.log("mongodb connected");
  })
  .catch((error) => {
    console.log("connection failed", error);
  });

app.use(express.static(path.join(__dirname, "public")));

app.use("/admin", indexRouter);
app.use("/", usersRouter);
app.use("/", otpRouter);
app.use('*', (req,res)=>{ 
  res.render('admin/404error')
});

app.listen(process.env.PORT, () => {
  console.log(`http://localhost:${process.env.PORT}`);
});
