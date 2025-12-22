import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

function OrdersPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders/history");
        setOrders(res.data.orders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  if (loading) return <p>Loading orders...</p>;
  if (orders.length === 0) return <p>No orders yet.</p>;

  return (
    <div>
      <h2>Your Order History</h2>
      {orders.map(order => (
        <div key={order.id}>
          <h3>Order #{order.id} - {order.status}</h3>
          <p>Created at: {new Date(order.created_at).toLocaleString()}</p>
          <p>Total: ${order.total}</p>
          <ul>
            {order.items.map(item => (
              <li key={item.id}>
                {item.name} - Quantity: {item.quantity} - Price: ${item.price}
              </li>
            ))}
          </ul>
          <hr />
        </div>
      ))}
    </div>
  );
}

export default OrdersPage;
