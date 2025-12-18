const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const registerUser = async (req, res) => {
const { name, email, password } = req.body;


if (!name || !email || !password) {
return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
}


try {
// Check if user already exists
const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
if (userExist.rows.length > 0) {
return res.status(400).json({ success: false, message: 'El email ya está registrado' });
}


// Encrypt password
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);


// Insert new user
const newUser = await pool.query(
'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
[name, email, hashedPassword]
);


res.status(201).json({ success: true, user: newUser.rows[0] });


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
      return res.status(400).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];

    // Compare pass
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Contraseña incorrecta' });
    }

    //Generating JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'secretkey', // tu clave secreta en .env
      { expiresIn: '1h' }
    );

    res.json({ success: true, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
module.exports = { registerUser, loginUser };