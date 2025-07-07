// server.js
const express = require('express');
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Simple route
app.get('/', (req, res) => {
    res.send('Otobix server is running');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
