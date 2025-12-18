const express = require('express');
require('dotenv').config();
const pool = require('./config/db');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
const PORT = process.env.PORT || 3000;



// Middleware for JSON
app.use(express.json());

const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');

app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/carts', cartRoutes);
app.use('/orders', ordersRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
console.log('API docs available at http://localhost:3000/api-docs');

app.get('/', (req, res) => {
  res.send('API working');
});

// Testing db
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      success: true,
      time: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initializing
app.listen(PORT, () => {
console.log(`Servidor corriendo en http://localhost:${PORT}`);
});