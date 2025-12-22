import { useEffect, useState } from "react";
import api from "../services/api";

function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get cart from backend
  const fetchCart = async () => {
    try {
      const res = await api.get("/checkout/cart");
      setCart(res.data.items || []);
    } catch (err) {
      console.error(err);
      setError("Error fetching cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Change quantity
  const updateQuantity = async (product_id, quantity) => {
    try {
      await api.put(`/checkout/cart/${product_id}`, { quantity });
      fetchCart(); // refresh
    } catch (err) {
      console.error(err);
      alert("Error updating quantity");
    }
  };

  // Delete item
  const removeItem = async (product_id) => {
    try {
      await api.delete(`/checkout/cart/${product_id}`);
      fetchCart();
    } catch (err) {
      console.error(err);
      alert("Error removing item");
    }
  };

  // Checkout
  const handleCheckout = async () => {
  try {
    const res = await api.post("/checkout/create-checkout-session", {
      items: cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        product_id: item.product_id
      }))
    });
    window.location.href = res.data.url; // redirect to Stripe
  } catch (err) {
    console.error(err);
    alert("Error creating checkout session");
  }
};

  if (loading) return <p>Loading cart...</p>;
  if (error) return <p>{error}</p>;
  if (cart.length === 0) return <p>Your cart is empty.</p>;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container">
  <h2>Your Cart</h2>
  {cart.map((item) => (
    <div key={item.product_id} className="card">
      <h3>{item.name}</h3>
      <p>Price: ${item.price}</p>
      <p>Quantity: <span>{item.quantity}</span>
  <span className="quantity-controls">
    <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
    <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
  </span>
</p>
      <button onClick={() => removeItem(item.product_id)}>Remove</button>
    </div>
  ))}
  <h3>Total: ${total.toFixed(2)}</h3>
  <button onClick={handleCheckout}>Checkout</button>
</div>
  );
}

export default Cart;
