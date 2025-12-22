const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { auth } = require("../middlewares/auth");
const pool = require("../config/db");

router.get("/cart", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.cart_id, ci.product_id, ci.quantity, p.name, p.price
       FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       JOIN products p ON p.id = ci.product_id
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    res.json({ success: true, items: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add to Cart
router.post("/cart", auth, async (req, res) => {
  const { product_id, quantity } = req.body;

  try {
    // Get cart
    let cartResult = await pool.query("SELECT * FROM carts WHERE user_id = $1", [req.user.id]);
    let cart_id;
    if (cartResult.rows.length === 0) {
      const newCart = await pool.query("INSERT INTO carts (user_id) VALUES ($1) RETURNING id", [req.user.id]);
      cart_id = newCart.rows[0].id;
    } else {
      cart_id = cartResult.rows[0].id;
    }

    // Update cart
    const itemResult = await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING *`,
      [cart_id, product_id, quantity]
    );

    res.json({ success: true, item: itemResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Quantity
router.put("/cart/:product_id", auth, async (req, res) => {
  const { product_id } = req.params;
  const { quantity } = req.body;

  try {
    // Get cart
    const cartResult = await pool.query("SELECT * FROM carts WHERE user_id = $1", [req.user.id]);
    if (cartResult.rows.length === 0) return res.status(404).json({ success: false, message: "Cart not found" });

    const cart_id = cartResult.rows[0].id;

    const itemResult = await pool.query(
      `UPDATE cart_items
       SET quantity = $1
       WHERE cart_id = $2 AND product_id = $3
       RETURNING *`,
      [quantity, cart_id, product_id]
    );

    if (itemResult.rows.length === 0)
      return res.status(404).json({ success: false, message: "Cart item not found" });

    res.json({ success: true, item: itemResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Remove Cart Item
router.delete("/cart/:product_id", auth, async (req, res) => {
  const { product_id } = req.params;

  try {
    const cartResult = await pool.query("SELECT * FROM carts WHERE user_id = $1", [req.user.id]);
    if (cartResult.rows.length === 0) return res.status(404).json({ success: false, message: "Cart not found" });

    const cart_id = cartResult.rows[0].id;

    const itemResult = await pool.query(
      `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 RETURNING *`,
      [cart_id, product_id]
    );

    if (itemResult.rows.length === 0)
      return res.status(404).json({ success: false, message: "Cart item not found" });

    res.json({ success: true, message: "Item removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Order + Checkout
router.post("/create-checkout-session", auth, async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "No items provided for checkout" });
  }

  try {
    // Get cart
    const cartResult = await pool.query("SELECT * FROM carts WHERE user_id = $1", [req.user.id]);
    if (cartResult.rows.length === 0) return res.status(404).json({ success: false, message: "Cart not found" });

    const cart_id = cartResult.rows[0].id;

    // Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map(item => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/orders?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/cart?canceled=true`,
    });

    res.json({ url: session.url });

    // Clear cart after checkout
    await pool.query("DELETE FROM cart_items WHERE cart_id = $1", [cart_id]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
