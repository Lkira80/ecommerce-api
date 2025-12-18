const pool = require('../config/db');

// Get all products
const getProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json({ success: true, products: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create product
const createProduct = async (req, res) => {
  const { name, description, price, stock, image_url, category_id } = req.body;

  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields: name, price or stock' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, image_url, category_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description || null, price, stock, image_url || null, category_id || null]
    );
    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image_url, category_id } = req.body;

  if (!name && !description && price === undefined && stock === undefined && !image_url && !category_id) {
    return res.status(400).json({ success: false, message: 'No data to update' });
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         price = COALESCE($3, price),
         stock = COALESCE($4, stock),
         image_url = COALESCE($5, image_url),
         category_id = COALESCE($6, category_id)
       WHERE id = $7
       RETURNING *`,
      [name, description, price, stock, image_url, category_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    res.json({ success: true, message: 'Producto eliminado', product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};