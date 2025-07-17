// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../Models/userModel');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Format: "Bearer token"

  if (!token) return res.status(401).json({ message: 'No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};
