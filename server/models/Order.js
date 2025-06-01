import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: 'user' },
  items: [{
    product: { type: String, required: true, ref: 'product' },
    quantity: { type: Number, required: true }
  }],
  amount: { type: Number, required: true },
  address: { type: Object, required: true },  // Changed from String to Object for address fields
  status: { type: String, default: 'Order Placed' },
  paymentType: { type: String, required: true },
  isPaid: { type: Boolean, required: true, default: false },
  paymentId: { type: String } // store Razorpay payment id for reference
}, { timestamps: true });

const Order = mongoose.models.order || mongoose.model('order', orderSchema);

export default Order;
