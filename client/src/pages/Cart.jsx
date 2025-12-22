import { useState, useEffect } from "react";
import api from "../services/api";

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await api.get("/cart"); 
        setCartItems(res.data.items); 
      } catch (err) {
        console.error(err);
        setError("Error fetching cart");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // Delete item
  const handleRemove = async (productId) => {
    try {
      await api.delete(`/cart/${productId}`);
      setCartItems(cartItems.filter(item => item.product.id !== productId));
    } catch (err) {
      console.error(err);
      alert("Error removing item");
    }
  };

  // Update quantity
  const handleUpdateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
    try {
      const res = await api.put(`/cart/${productId}`, { quantity });
      setCartItems(cartItems.map(item =>
        item.product.id === productId ? res.data.item : item
      ));
    } catch (err) {
      console.error(err);
      alert("Error updating quantity");
    }
  };

  // Checkout
  const handleCheckout = async () => {
    try {
      const res = await api.post("/checkout/create-checkout-session", {
        items: cartItems.map(({ product, quantity }) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
        })),
      });

      // Redirect to Stripe Checkout
      window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
      alert("Error creating checkout session");
    }
  };

  // Render
  if (loading) return <p>Loading cart...</p>;
  if (error) return <p>{error}</p>;
  if (cartItems.length === 0) return <p>Your cart is empty</p>;

  return (
    <div>
      <h2>Your Cart</h2>
      <ul>
        {cartItems.map(({ product, quantity }) => (
          <li key={product.id}>
            <p>{product.name} - ${product.price} x {quantity}</p>
            <button onClick={() => handleUpdateQuantity(product.id, quantity - 1)}>-</button>
            <button onClick={() => handleUpdateQuantity(product.id, quantity + 1)}>+</button>
            <button onClick={() => handleRemove(product.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <p>
        Total: $
        {cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)}
      </p>
      <button onClick={handleCheckout}>Checkout</button>
    </div>
  );
}

export default Cart;
