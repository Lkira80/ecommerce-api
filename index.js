const express = require('express');


const app = express();
const PORT = 3000;


// Middleware for JSON
app.use(express.json());

// Initializing
app.listen(PORT, () => {
console.log(`Servidor corriendo en http://localhost:${PORT}`);
});