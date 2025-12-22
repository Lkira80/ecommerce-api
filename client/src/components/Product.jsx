function Product({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      {product.image && <img src={product.image} alt={product.name} />}
      <hr />
    </div>
  );
}

export default Product;

