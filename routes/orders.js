const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const {
  getOrders,
  getOrderById,
  createOrder
} = require('../controllers/ordersController');
const { adminOnly } = require('../middlewares/roles');
const { updateOrderStatus, cancelOrder, getAllOrders } = require('../controllers/ordersController');

router.get('/', auth, getOrders);
router.get('/:id', auth, getOrderById);
router.post('/', auth, createOrder);
router.put('/:id/status', auth, adminOnly, updateOrderStatus);
router.put('/:id/cancel', auth, adminOnly, cancelOrder);
router.get('/all', auth, adminOnly, getAllOrders);

module.exports = router;
