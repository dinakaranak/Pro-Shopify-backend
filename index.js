require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const multer = require("multer");
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./utils/errorHandler').errorHandler;
// const { errorHandler } = require('./middlewares/error');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();
// Middleware
app.use(cors());
app.use(express.json());

const productRoutes = require('./routes/productRoutes');
const BannerRoutes = require('./routes/Banner')
const AdminUserRoutes = require('./routes/adminRoutes');

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}



// Routes
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/products', productRoutes);
app.use('/api/banners', BannerRoutes);
app.use('/api/adminUsers', AdminUserRoutes);
// Error handling middleware
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});