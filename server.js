// server.js
const express = require('express');
require('dotenv').config();
const bodyParser = require("body-parser");
const cors = require("cors");
const os = require('os');
const http = require('http'); // <--- required for WebSocket

const connectDB = require("./Config/mongo_db");
connectDB();
const app = express();

const server = http.createServer(app); // <--- HTTP server needed for socket
const SocketService = require('./Config/socket_service'); // Import
SocketService.initialize(server); // Initialize with HTTP server

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// const otpRoutes = require("./Routes/otpRoutes");
// app.use("/api", otpRoutes);

const otpRoutes = require('./Routes/otpRoutes');

app.use(express.json());
app.use('/api/otp', otpRoutes);
///////////////////////////

const userRoutes = require("./Routes/userRoutes");
app.use("/api/user", userRoutes);

// Car Details Routes
const carDetailsRoutes = require('./Routes/carDetailsRoutes');
app.use('/api/car', carDetailsRoutes);

// Import Appsheet Data To MongoDB
const importAppsheetDataToMongoDB = require('./Config/Import Appsheet Data/import_appsheet_data_to_mongodb');
app.use(express.json());
app.use('/api', importAppsheetDataToMongoDB);

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

server.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`Server listening at:`);
    console.log(`→ http://localhost:${PORT}`);
    console.log(`→ http://${localIP}:${PORT}  (use this on another PC)`);

    // For keeping render awake
    const SelfPing = require('./Extra Files/self_ping');
    const selfPing = new SelfPing('https://otobix-app-backend.onrender.com/ping');
    selfPing.start();
    ///////////////////////////
});

const dummyController = require('./Controllers/dummy');
app.get('/api/dummy', dummyController.dummyFunctionForNow);





// // Only for testing in browser
// const path = require('path');
// app.get('/test', (req, res) => {
//     res.sendFile(path.join(__dirname, 'Controllers', 'dummy_browser_test.html'));
// });
