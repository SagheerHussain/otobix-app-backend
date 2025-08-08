const express = require('express');
const router = express.Router();
const { ping } = require('../Extra Files/self_ping');

router.get('/ping', ping); // 👈 lightweight GET endpoint for Render

module.exports = router;



// app.get('/ping', (req, res) => {
//     res.send('pong');
// });
