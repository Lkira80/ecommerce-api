const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/usersController');
const { auth } = require('../middlewares/auth');

// Register
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// User profile
router.get('/profile', auth, (req, res) => {
  res.json({
    success: true,
    message: `Hello ${req.user.email}, this is your profile`,
    user: req.user
  });
});

module.exports = router;