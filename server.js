'use strict';
require('dotenv').config();
console.log('Session secret is:', process.env.SESSION_SECRET); // Add this line to debug
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const cors = require('cors');
const session = require('express-session')
const passport = require('passport')
const { MongoClient, ObjectID } = require('mongodb');

const app = express();

app.use(cors());

app.set('view engine', 'pug');
app.set('views', './views/pug');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {secure: false}
}));

app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); // For fCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.route('/').get((req, res) => {
  // Change the response to render the Pug template
  res.render('index', {title: 'Hello', message: 'Please log in'});
  
});

myDB(async client =>{
  const myDataBase = await client.db('database').collection('users');

  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to the database',
      message: 'Please login'
    });
  });
passport.serializeUser((user, done) => {
  done(null, user._id);
})

passport.deserializeUser((id, done) => {
  myDataBase.findOne({_id: new ObjectID(id)}, (err, doc) => {
    done(null, doc);
  });
});

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', {title: e, message: 'Unable to connect to database' });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});