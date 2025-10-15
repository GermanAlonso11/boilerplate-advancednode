const passport = require("passport");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local");
const ObjectId = require("mongodb").ObjectId;


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
}