const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const User = require('../models/User');

// Protect: Checks if user is logged in
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
console.log("Authorization header:", authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({ message: 'No token, not authorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await AdminUser.findById(decoded.id);
    if (!user) {
      user = await User.findById(decoded.id);
    }console.log("Decoded user ID:", decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    console.log("Authenticated user:", req.user ? req.user.name : 'No user found');
    
    next(); // continue to next handler
  } catch (err) {
      if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
  //  req.user = {
  //   id: '1234567890',
  //   name: 'Dummy Admin',
  //   email: 'dummy@admin.com',
  //   role: 'admin', // change to 'supplier' if needed
  //   isActive: true,
  // };
  // next();
};

// Require Role: Checks if user is an admin
const requireRole = (role) => {
  console.log("Role required:");
  
  return (req, res, next) => {
    console.log("Checking user role:", req.user ? req.user.role : 'No user');
    
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Access denied: admin only' });
    }
    next();
  };
};

module.exports = {
  protect,
  requireRole,
};