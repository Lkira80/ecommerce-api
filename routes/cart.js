const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { getCart, addToCart, updateCartItem, deleteCartItem } = require('../controllers/cartController');

router.get('/', auth, getCart);
router.post('/', auth, addToCart);
router.put('/:id', auth, updateCartItem);
router.delete('/:id', auth, deleteCartItem);

module.exports = router;