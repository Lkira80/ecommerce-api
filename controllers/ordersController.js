const pool = require('../config/db');

// GET /orders
const getOrders = async (req, res) => {
  const userId = req.user.id;

  try {
    const ordersRes = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ success: true, orders: ordersRes.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /orders/:id
const getOrderById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const orderRes = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const itemsRes = await pool.query(
      `SELECT oi.id, oi.quantity, oi.price_at_buy, p.name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      success: true,
      order: orderRes.rows[0],
      items: itemsRes.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /orders - CHECKOUT (CON TRANSACCIÓN)
const createOrder = async (req, res) => {
  const userId = req.user.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Get cart
    const cartRes = await client.query(
      'SELECT * FROM carts WHERE user_id = $1',
      [userId]
    );

    if (cartRes.rows.length === 0) {
      throw new Error('Cart is empty');
    }

    const cartId = cartRes.rows[0].id;

    // 2. Get cart items
    const itemsRes = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (itemsRes.rows.length === 0) {
      throw new Error('Cart has no items');
    }

    // 3. Validate stock + calculate total
    let total = 0;

    for (const item of itemsRes.rows) {
      if (item.quantity > item.stock) {
        throw new Error(`Not enough stock for product ${item.product_id}`);
      }
      total += item.quantity * item.price;
    }

    // 4. Create order
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, total_amount, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [userId, total]
    );

    const orderId = orderRes.rows[0].id;

    // 5. Create order items + update stock
    for (const item of itemsRes.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_buy)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // 6. Empty cart
    await client.query(
      'DELETE FROM cart_items WHERE cart_id = $1',
      [cartId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: orderRes.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
};

// PUT /orders/:id/status
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'paid', 'shipped', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}` });
  }

  try {
    const updated = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Order status updated', order: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
};

