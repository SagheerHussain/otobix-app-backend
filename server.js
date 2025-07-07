// server.js
const express = require('express');
require('dotenv').config();
const bodyParser = require("body-parser");
const cors = require("cors");

const connectDB = require("./Config/db");
connectDB();

const app = express();


const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Routes
const otpRoutes = require("./Routes/otpRoutes");
app.use("/api", otpRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Otobix server is running');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
