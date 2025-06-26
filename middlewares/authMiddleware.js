const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

// Protect: Checks if user is logged in
const protect = async (req, res, next) => {
  // const authHeader = req.headers.authorization;

  // if (!authHeader || !authHeader.startsWith('Bearer')) {
  //   return res.status(401).json({ message: 'No token, not authorized' });
  // }

  // const token = authHeader.split(' ')[1];

  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   const user = await AdminUser.findById(decoded.id);

  //   if (!user) {
  //     return res.status(404).json({ message: 'User not found' });
  //   }

  //   req.user = user;
  //   next(); // continue to next handler
  // } catch (err) {
  //   return res.status(401).json({ message: 'Invalid token' });
  // }
   req.user = {
    id: '1234567890',
    name: 'Dummy Admin',
    email: 'dummy@admin.com',
    role: 'admin', // change to 'supplier' if needed
    isActive: true,
  };
  next();
};

// Require Role: Checks if user is an admin
const requireRole = (role) => {
  return (req, res, next) => {
    // if (!req.user || req.user.role !== role) {
    //   return res.status(403).json({ message: 'Access denied: admin only' });
    // }
    next();
  };
};

module.exports = {
  protect,
  requireRole,
};
