require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const multer = require("multer");
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./utils/errorHandler').errorHandler;
// const { errorHandler } = require('./middlewares/error');
const path = require('path');
const imageupload=require('./routes/uploadRoute');
const categoryRoutes = require('./routes/categoryRoutes');
const SupplierProduct = require('./routes/suplierRoute');
const cartRoutes = require('./routes/cartRoute');
const orderRoutes = require('./routes/orderRoute');
const userRoutes = require('./routes/userRoute');
const wishlistRoutes = require('./routes/wishlistRoute');
const offerRoutes = require('./routes/offerRoutes');
// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();


// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const productRoutes = require('./routes/productRoutes');
const BannerRoutes = require('./routes/Banner')
const AdminUserRoutes = require('./routes/adminRoutes');
const SubBannerRoutes = require('./routes/SubBannerRoutes')
app.use('/api/categories', categoryRoutes);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}


// Routes
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/upload', imageupload);
app.use('/api/products', productRoutes);
app.use('/api/banners', BannerRoutes);
app.use('/api/adminUsers', AdminUserRoutes);
app.use('/api/subbanners', SubBannerRoutes);
app.use('/api/supplier-products', SupplierProduct); 
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api', offerRoutes);
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