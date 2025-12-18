const pool = require('../config/db');

// Get all products from cart
const getCart = async (req, res) => {
  const userId = req.user.id;
  try {
    const cartRes = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    if (cartRes.rows.length === 0) return res.json({ success: true, cart: [] });

    const cartId = cartRes.rows[0].id;
    const itemsRes = await pool.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    res.json({ success: true, cart: itemsRes.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Adding product
const addToCart = async (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity } = req.body;
  if (!product_id || !quantity) return res.status(400).json({ success: false, message: 'Missing data' });

  try {
    let cartRes = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    let cartId;
    if (cartRes.rows.length === 0) {
      const newCart = await pool.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]);
      cartId = newCart.rows[0].id;
    } else {
      cartId = cartRes.rows[0].id;
    }

    // Check if product already exists
    const existing = await pool.query(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, product_id]
    );

    if (existing.rows.length > 0) {
      const updated = await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
        [quantity, existing.rows[0].id]
      );
      return res.json({ success: true, cartItem: updated.rows[0] });
    }

    const newItem = await pool.query(
      'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [cartId, product_id, quantity]
    );

    res.status(201).json({ success: true, cartItem: newItem.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Updating item quantity
const updateCartItem = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { quantity } = req.body;
  if (!quantity) return res.status(400).json({ success: false, message: 'Missing quantity' });

  try {
    const updated = await pool.query(
      `UPDATE cart_items ci
       SET quantity = $1
       FROM carts c
       WHERE ci.id = $2 AND ci.cart_id = c.id AND c.user_id = $3
       RETURNING ci.*`,
      [quantity, id, userId]
    );

    if (updated.rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });

    res.json({ success: true, cartItem: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete item
const deleteCartItem = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const deleted = await pool.query(
      `DELETE FROM cart_items ci
       USING carts c
       WHERE ci.id = $1 AND ci.cart_id = c.id AND c.user_id = $2
       RETURNING ci.*`,
      [id, userId]
    );

    if (deleted.rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });

    res.json({ success: true, message: 'Item deleted', cartItem: deleted.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem
};