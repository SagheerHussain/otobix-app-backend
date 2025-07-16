// server.js
const express = require('express');
require('dotenv').config();
const bodyParser = require("body-parser");
const cors = require("cors");
const os = require('os');

const connectDB = require("./Config/db");
connectDB();
const app = express();

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

const otpRoutes = require("./Routes/otpRoutes");
app.use("/api", otpRoutes);

const userRoutes = require("./Routes/userRoutes");
app.use("/api/user", userRoutes);

app.get('/', (req, res) => {
    res.send('Otobix server is running');
});

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`Server listening at:`);
    console.log(`→ http://localhost:${PORT}`);
    console.log(`→ http://${localIP}:${PORT}  (use this on another PC)`);
});
