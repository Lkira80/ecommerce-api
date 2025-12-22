const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { auth } = require("../middlewares/auth");
const { createOrder, payOrder } = require("../controllers/ordersController");

// Payment Session
router.post("/create-checkout-session", auth, async (req, res) => {
  const { items } = req.body; 
  
  try {
    const order = await createOrder(req.user.id, items);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map(item => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/orders?success=true&orderId=${order.id}`,
      cancel_url: `${process.env.FRONTEND_URL}/cart?canceled=true`,
    });

    res.json({ url: session.url, orderId: order.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating checkout session" });
  }
});

// Stripe Webhook
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature failed", err.message);
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.orderId;
    // Mark order as paid
    await payOrder(orderId);
  }

  res.sendStatus(200);
});

module.exports = router;
