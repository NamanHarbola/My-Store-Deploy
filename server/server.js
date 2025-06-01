import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import 'dotenv/config';
import userRouter from './routes/userRoute.js';
import sellerRouter from './routes/sellerRoute.js';
import connectCloudinary from './configs/cloudinary.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import addressRouter from './routes/addressRoute.js';
import orderRouter from './routes/orderRoute.js';
import paymentRoutes from './routes/paymentRoutes.js'; // import here
import { razorpayWebhook } from './controllers/orderController.js';

const app = express();
const port = process.env.PORT || 4000;

// Allowed origins for CORS - define before middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://my-store-deploy.vercel.app',
];

// CORS middleware - put before routes
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Razorpay webhook must be before json parser middleware
app.post('/razorpay-webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

// Other middlewares
app.use(express.json());
app.use(cookieParser());

// Test route
app.get('/', (req, res) => res.send("API is Working"));

// API routes
app.use('/api/payment', paymentRoutes);
app.use('/api/user', userRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/address', addressRouter);
app.use('/api/order', orderRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.message || err);
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start server only after DB and Cloudinary connection
async function startServer() {
  try {
    await connectDB();
    await connectCloudinary();
    console.log('Database and Cloudinary connected');

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to DB or Cloudinary:', error);
    process.exit(1);
  }
}

startServer();
