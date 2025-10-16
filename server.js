"use strict";
require("dotenv").config();
console.log("Session secret is:", process.env.SESSION_SECRET); // Add this line to debug
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const routes = require("./routes.js");
const auth = require("./auth.js");

const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);
const MongoStore = require('connect-mongo')(session);
const cookieParser = require('cookie-parser');
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });
const passportSocketIo = require('passport.socketio');

app.use(cors());

app.set("view engine", "pug");
app.set("views", "./views/pug");

function onAuthorizeSuccess(data, accept) {
    console.log('User authorized successfully');
    accept(null, true);
  }

  function onAuthorizeFail(data, message, error, accept) {
    console.log('User authorization failed');
    if (error) accept(new Error(message));
  }

  function onAuthorizeFail(data, message, error, accept) {
    if (error) throw new Error(message);
    console.log('failed connection to socket.io:', message);
    accept(null, false);
  }

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
    store: store,
    key: 'express.sid'
  })
);

app.use(passport.initialize());
app.use(passport.session());

io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: 'express.sid',
  secret: process.env.SESSION_SECRET,
  store: store,
  success: onAuthorizeSuccess,
  fail: onAuthorizeFail
}));


fccTesting(app); // For fCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");

  routes(app, myDataBase);
  auth(app, myDataBase);

  let currentUsers = 0;
  io.on('connection', (socket) => {
    ++currentUsers;
    io.emit('user', { 
        username: socket.request.user.username,
        currentUsers,
        connected: true
     });
    console.log('A user has connected');

    socket.on('chat message', (message) => {
      io.emit('chat message', {username: socket.request.user.username, message: message});
    });

    socket.on('disconnect', () => {
      --currentUsers;
      io.emit('user', { 
        username: socket.request.user.username,
        currentUsers,
        connected: false
       });
      console.log('A user has disconnected');
    });

  });

  // Be sure to add this...
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
  6;
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("index", { title: e, message: "Unable to connect to database" });
  });
});
// app.listen out here...
