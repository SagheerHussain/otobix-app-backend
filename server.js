// server.js  (CommonJS)
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const os = require('os');
const http = require('http');
const path = require('path');

const connectDB = require('./Config/mongo_db');
const { initAgenda } = require('./Agenda/agenda2'); // using agenda2 only
const SocketService = require('./Config/socket_service');

const app = express();
const server = http.createServer(app);
SocketService.initialize(server);

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// routes
app.use('/api/otp', require('./Routes/otpRoutes'));
app.use('/api/user', require('./Routes/userRoutes'));
app.use('/api/car', require('./Routes/carDetailsRoutes'));
app.use('/api/user/notifications', require('./Routes/userNotificationsRoutes'));
app.use('/api/upcoming', require('./Routes/upcoming_routes'));
app.use('/api', require('./Config/Import Appsheet Data/import_appsheet_data_to_mongodb'));
app.use('/api', require('./Extra Files/extra_files_routes'));
app.use('/api', require('./Extra Files/dummy_routes'));

app.get('/', (req, res) => res.send('Otobix server is running'));
app.get('/test', (req, res) =>
  res.sendFile(path.join(__dirname, 'Controllers', 'dummy_browser_test.html'))
);

// ---- boot in async IIFE (no top-level await) ----
(async () => {
  try {
    await connectDB();     // make sure this uses process.env.MONGO_URI internally
    await initAgenda();    // start Agenda (same MONGO_URI)

    server.listen(PORT, '0.0.0.0', () => {
      const ip = getLocalIP();
      console.log(`Server listening at:`);
      console.log(`→ http://localhost:${PORT}`);
      console.log(`→ http://${ip}:${PORT}  (use this on another PC)`);

      // keep-alive ping
      const axios = require('axios');
      setInterval(async () => {
        try {
          await axios.get('https://otobix-app-backend.onrender.com/api/ping');
          console.log(`[AutoPing] Successful at ${new Date().toISOString()}`);
        } catch (err) {
          console.error('[AutoPing] Failed:', err.message);
        }
      }, 10 * 60 * 1000);
    });
  } catch (err) {
    console.error('Boot error:', err);
    process.exit(1);
  }
})();

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}



// // server.js
// const express = require('express');
// require('dotenv').config();
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const os = require('os');
// const http = require('http'); // <--- required for WebSocket
// const agenda = require('./Config/agenda'); // Ensure agenda starts on boot


// const connectDB = require("./Config/mongo_db");
// await connectDB();
// const app = express();

// const server = http.createServer(app); // <--- HTTP server needed for socket
// const SocketService = require('./Config/socket_service'); // Import
// SocketService.initialize(server); // Initialize with HTTP server

// const PORT = process.env.PORT || 4000;

// app.use(cors());
// app.use(bodyParser.json());

// // const otpRoutes = require("./Routes/otpRoutes");
// // app.use("/api", otpRoutes);

// const otpRoutes = require('./Routes/otpRoutes');

// app.use(express.json());
// app.use('/api/otp', otpRoutes);
// ///////////////////////////

// const userRoutes = require("./Routes/userRoutes");
// app.use("/api/user", userRoutes);

// // Car Details Routes
// const carDetailsRoutes = require('./Routes/carDetailsRoutes');
// app.use('/api/car', carDetailsRoutes);

// // User Notifications Routes
// const userNotificationsRoutes = require('./Routes/userNotificationsRoutes');
// app.use('/api/user/notifications', userNotificationsRoutes);

// // Import Appsheet Data To MongoDB
// const importAppsheetDataToMongoDB = require('./Config/Import Appsheet Data/import_appsheet_data_to_mongodb');
// app.use(express.json());
// app.use('/api', importAppsheetDataToMongoDB);

// // Import the ping route
// const pingRoutes = require('./Extra Files/extra_files_routes'); // adjust if path differs
// app.use('/api', pingRoutes);

// app.get('/', (req, res) => {
//     res.send('Otobix server is running');
// });

// // Initialize and Start Agenda 2
// const agenda2 = require('./Agenda/agenda2');
// await agenda2.initAgenda();

// function getLocalIP() {
//     const interfaces = os.networkInterfaces();
//     for (const name in interfaces) {
//         for (const iface of interfaces[name]) {
//             if (iface.family === 'IPv4' && !iface.internal) {
//                 return iface.address;
//             }
//         }
//     }
//     return 'localhost';
// }

// server.listen(PORT, '0.0.0.0', () => {
//     const localIP = getLocalIP();
//     console.log(`Server listening at:`);
//     console.log(`→ http://localhost:${PORT}`);
//     console.log(`→ http://${localIP}:${PORT}  (use this on another PC)`);


//     // ✅ Auto ping to keep Render awake
//     const axios = require('axios');
//     setInterval(async () => {
//         try {
//             await axios.get('https://otobix-app-backend.onrender.com/api/ping');
//             console.log(`[AutoPing] Successful at ${new Date().toISOString()}`);
//         } catch (err) {
//             console.error('[AutoPing] Failed:', err.message);
//         }
//     }, 10 * 60 * 1000); // 10 minutes
//     ///////////////////////////
// });

// // const dummyController = require('./Extra Files/dummy');
// // app.get('/api/dummy', dummyController.dummyFunctionForNow);
// // Import the dummy routes
// const dummyRoutes = require('./Extra Files/dummy_routes');
// app.use('/api', dummyRoutes);





// // Only for testing in browser
// const path = require('path');
// app.get('/test', (req, res) => {
//     res.sendFile(path.join(__dirname, 'Controllers', 'dummy_browser_test.html'));
// });
