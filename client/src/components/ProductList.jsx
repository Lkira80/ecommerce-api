import Product from "./Product";

function ProductList({ products }) {
  if (!products || products.length === 0) {
    return <p>No products available.</p>;
  }

  return (
    <div>
      {products.map((product) => (
        <Product key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductList;
