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
import { razorpayWebhook } from './controllers/orderController.js';

const app = express();
const port = process.env.PORT || 4000;

try {
  await connectDB();
  await connectCloudinary();
  console.log('Database and Cloudinary connected');
} catch (error) {
  console.error('Failed to connect to DB or Cloudinary:', error);
  process.exit(1);
}

// Update this with your actual frontend URL deployed on Vercel
const allowedOrigins = [
  'http://localhost:5173',                  // for local dev
  'https://my-store-deploy.vercel.app',    // your deployed frontend URL
];

// CORS middleware setup
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy does not allow access from origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,  // allow cookies and auth headers
}));

// Razorpay webhook requires raw body parser before JSON parser
app.post('/razorpay-webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

// After raw parser, parse JSON for all other routes
app.use(express.json());
app.use(cookieParser());

// Basic route to test API
app.get('/', (req, res) => res.send("API is Working"));

// API Routes
app.use('/api/user', userRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/address', addressRouter);
app.use('/api/order', orderRouter);

// Global error handler (optional)
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.message || err);
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
