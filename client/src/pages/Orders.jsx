import { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

function Orders() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const res = await api.get("/orders"); 
        setOrders(res.data.orders);
      } catch (err) {
        console.error(err);
        setError("Error fetching orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>{error}</p>;
  if (orders.length === 0) return <p>You have no orders</p>;

  return (
    <div>
      <h2>Your Orders</h2>
      <ul>
        {orders.map(order => (
          <li key={order.id}>
            <p>Order ID: {order.id}</p>
            <p>Status: {order.status}</p>
            <p>Paid: {order.paid ? "Yes" : "No"}</p>
            <p>Total: ${order.total}</p>
            <ul>
              {order.items.map(item => (
                <li key={item.product.id}>
                  {item.product.name} x {item.quantity} - ${item.product.price}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Orders;

