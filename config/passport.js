const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // Search user from DB
        let userResult = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
        let user;
        if (userResult.rows.length > 0) {
          user = userResult.rows[0];
        } else {
          // Createuser
          const newUser = await pool.query(
            "INSERT INTO users (name, email, password, provider) VALUES ($1, $2, $3, $4) RETURNING id, name, email",
            [name, email, null, "google"]
          );
          user = newUser.rows[0];
        }

        // Generate JWT
        const token = jwt.sign(
          { id: user.id, name: user.name, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        done(null, token);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

/*passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/facebook/callback`,
      profileFields: ["id", "emails", "displayName"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // Search user in DB
        let userResult = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
        let user;
        if (userResult.rows.length > 0) {
          user = userResult.rows[0];
        } else {
          const newUser = await pool.query(
            "INSERT INTO users (name, email, password, provider) VALUES ($1, $2, $3, $4) RETURNING id, name, email",
            [name, email, null, "facebook"]
          );
          user = newUser.rows[0];
        }

        // Generate JWT
        const token = jwt.sign(
          { id: user.id, name: user.name, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        done(null, token);
      } catch (err) {
        done(err, null);
      }
    }
  )
);*/

passport.serializeUser((token, done) => done(null, token));
passport.deserializeUser((token, done) => done(null, token));

module.exports = passport;
