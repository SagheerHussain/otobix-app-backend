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
// OTP Routes
const otpRoutes = require("./Routes/otpRoutes");
app.use("/api", otpRoutes);

// User Routes
const userRoutes = require("./Routes/userRoutes");
app.use("/api", userRoutes);




// Root route
app.get('/', (req, res) => {
    res.send('Otobix server is running');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
