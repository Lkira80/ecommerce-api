const express = require('express');
require('dotenv').config();
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;



// Middleware for JSON
app.use(express.json());

const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');

app.use('/users', userRoutes);
app.use('/products', productRoutes);

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