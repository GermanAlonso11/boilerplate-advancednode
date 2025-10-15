const passport = require("passport");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local");
const ObjectId = require("mongodb").ObjectId;
const GitHubStrategy = require("passport-github").Strategy;


module.exports = function (app, myDataBase) {
      // Serialization and deserialization here...
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    console.log(new ObjectId(id));
    try {
      const doc = await myDataBase.findOne({ _id: new ObjectId(id) });
      done(null, doc);
    } catch (err) {
      done(err, null);
    }
  });

  passport.use(
    new LocalStrategy((username, password, done) => {
      myDataBase.findOne({ username: username }, (err, user) => {
        console.log(`User ${username} attempted to log in.`);
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      });
    })
  );

  passport.use(
    new GitHubStrategy(
      {clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/github/callback"},
      function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        //Database logic here with callback containing our user object
        myDataBase.findOne({ githubId: profile.id }, (err, user) => {
          if (err) {
            return cb(err);
          }
          if (user) {
            return cb(null, user);
          }
          // If user doesn't exist, create a new one
          const newUser = {
            githubId: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            profileImage: profile._json.avatar_url
          };
          myDataBase.insertOne(newUser, (err, result) => {
            if (err) {
              return cb(err);
            }
            cb(null, result.ops[0]);
          });
        });
      }
    )
  );
};