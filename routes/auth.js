const express = require("express");
const router = express.Router();
const passport = require("passport");

// Login with Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback Google
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    if (!req.user) return res.redirect(`${process.env.FRONTEND_URL}/login`);
    const token = req.user; 
    res.redirect(`${process.env.FRONTEND_URL}/login/success?token=${token}`);
  }
);

module.exports = router;
