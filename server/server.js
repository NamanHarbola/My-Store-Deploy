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
  process.exit(1); // Exit the process if essential services fail
}

// Allow multiple origins (add your frontend URL here)
const allowedOrigins = ['http://localhost:5173', 'https://your-frontend-url.com'];

// Use CORS with credentials support
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin like mobile apps or curl requests
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Must come before other body parsers and routes for webhook raw body
app.post('/razorpay-webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

// After raw parser, use JSON body parser for other routes
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => res.send("API is Working"));
app.use('/api/user', userRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/address', addressRouter);
app.use('/api/order', orderRouter);

// Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
