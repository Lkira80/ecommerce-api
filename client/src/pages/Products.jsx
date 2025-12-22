import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data.products);
      } catch (err) {
        console.error(err);
        setError("Error fetching products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <p>Loading products...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Products</h2>
      {products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        products.map((product) => (
          <div key={product.id}>
            <h3>{product.name}</h3>
            <p>Price: ${product.price}</p>
            <Link to={`/products/${product.id}`}>View Details</Link>
            <hr />
          </div>
        ))
      )}
    </div>
  );
}

export default Products;

