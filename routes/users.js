const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require('../controllers/usersController');
const { auth } = require('../middlewares/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/', auth, getUsers);              // Get all users
router.get('/:id', auth, getUserById);       // Get user by ID
router.put('/:id', auth, updateUser);        // Update user
router.delete('/:id', auth, deleteUser);     // Delete user

module.exports = router;