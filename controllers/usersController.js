const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;


    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are mandatory' });
    }


    try {
    // Check if user already exists
        const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }


    // Encrypt password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


    // Insert new user
    const newUser = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, hashedPassword]
    );

    // Generate token
    const token = jwt.sign(
      { id: newUser.rows[0].id, name: newUser.rows[0].name, email: newUser.rows[0].email },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn:'1h'}
    )

    res.status(201).json({ success: true, user: newUser.rows[0],token });
   } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al registrar usuario' });
   }
};


// User login 
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }

  try {
    // Verify user
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Compare pass
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect password' });
    }

    //Generating JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1h' }
    );

    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users');
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!name && !email && !password) {
    return res.status(400).json({ success: false, message: 'No hay datos para actualizar' });
  }

  try {
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           password = COALESCE($3, password)
       WHERE id = $4
       RETURNING id, name, email`,
      [name, email, hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id, name, email', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.json({ success: true, message: 'Usuario eliminado', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};