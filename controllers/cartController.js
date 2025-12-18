const pool = require('../config/db');

// Get all items from user's cart
const getCart = async (req, res) => {
  const userId = req.user.id;
  try {
    const cartRes = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    if (cartRes.rows.length === 0) return res.json({ success: true, cart: [] });

    const cartId = cartRes.rows[0].id;
    const itemsRes = await pool.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, p.id AS product_id, p.name, p.price, p.stock
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

// Add product to cart
const addToCart = async (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'Required valid product and quantity' });
  }

  try {
    const productRes = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const product = productRes.rows[0];

    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Not enough stock. Current stock: ${product.stock}` });
    }

    let cartRes = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    let cartId;
    if (cartRes.rows.length === 0) {
      const newCart = await pool.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]);
      cartId = newCart.rows[0].id;
    } else {
      cartId = cartRes.rows[0].id;
    }

    const existing = await pool.query('SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, product_id]);

    if (existing.rows.length > 0) {
      const totalQuantity = existing.rows[0].quantity + quantity;
      if (totalQuantity > product.stock) {
        return res.status(400).json({ success: false, message: `You cannot add more than ${product.stock} items!` });
      }
      const updated = await pool.query('UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *', [quantity, existing.rows[0].id]);
      return res.json({ success: true, cartItem: updated.rows[0] });
    }

    const newItem = await pool.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *', [cartId, product_id, quantity]);
    res.status(201).json({ success: true, cartItem: newItem.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update quantity from cart item
const updateCartItem = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid quantity' });
  }

  try {
    const itemRes = await pool.query(
      `SELECT ci.*, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (itemRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });

    const item = itemRes.rows[0];
    if (quantity > item.stock) {
      return res.status(400).json({ success: false, message: `Not enough stock. Current stock: ${item.stock}` });
    }

    const updated = await pool.query('UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *', [quantity, id]);
    res.json({ success: true, cartItem: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete item from cart
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

    res.json({ success: true, message: 'Deleted item', cartItem: deleted.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Checkout cart -> create order
const checkoutCart = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get cart
    const cartRes = await pool.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    if (cartRes.rows.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty' });
    const cartId = cartRes.rows[0].id;

    const itemsRes = await pool.query(
      `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    const items = itemsRes.rows;
    if (items.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty' });

    // Validate stock
    for (const item of items) {
      if (item.quantity > item.stock) {
        return res.status(400).json({ success: false, message: `Not enough stock for product ${item.name}. Available: ${item.stock}` });
      }
    }

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order
    const orderRes = await pool.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, totalAmount, 'pending']
    );
    const orderId = orderRes.rows[0].id;

    // Insert order items & update stock
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_buy) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      await pool.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    res.json({ success: true, message: 'Checkout completed', order: orderRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  checkoutCart
};
