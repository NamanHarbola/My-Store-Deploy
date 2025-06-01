import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Place Razorpay Order (Online Payment) — Tax included
export const placeOrderRazorpay = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, address } = req.body;

    if (!address || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error("Product not found");
      subtotal += product.offerPrice * item.quantity;
    }

    const tax = parseFloat((subtotal * 0.0211).toFixed(2)); // 2.11% tax for online
    const totalAmount = parseFloat((subtotal + tax).toFixed(2));

    const order = await Order.create({
      userId,
      items,
      amount: totalAmount,
      address,
      paymentType: "Online",
      tax,
      subtotal,
      isPaid: false, // initially false
      paymentStatus: "Pending", // add a status field for frontend clarity
    });

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(totalAmount * 100), // in paise
      currency: "INR",
      receipt: `order_rcptid_${order._id}`,
      notes: {
        orderId: order._id.toString(),
        userId: userId.toString(),
      },
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Razorpay order created",
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id,
      orderId: order._id,
      tax,
      subtotal,
      totalAmount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Place COD Order — NO tax
export const placeOrderCOD = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, address } = req.body;

    if (!address || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error("Product not found");
      subtotal += product.offerPrice * item.quantity;
    }

    const tax = 0; // No tax for COD
    const totalAmount = parseFloat(subtotal.toFixed(2)); // total = subtotal

    const order = await Order.create({
      userId,
      items,
      amount: totalAmount,
      address,
      paymentType: "Cash On Delivery",
      tax,
      subtotal,
      isPaid: false, // COD not paid yet
      paymentStatus: "Pending",
    });

    console.log("COD Order created:", order);

    return res.status(200).json({
      success: true,
      message: "Order placed successfully with COD",
      orderId: order._id,
      tax,
      subtotal,
      totalAmount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all orders (for admin or seller)
// FILTER only orders that are COD or successfully paid
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { paymentType: "Cash On Delivery" },
        { isPaid: true }
      ]
    })
      .populate('items.product')
      .populate('userId', 'name email');

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get orders of logged-in user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ userId }).populate('items.product');
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Razorpay webhook handler
export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // req.body is raw body buffer (because of express.raw middleware)
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(req.body);
    const digest = shasum.digest('hex');

    if (signature !== digest) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const event = req.body.event;

    if (event === 'payment.captured') {
      const payment = req.body.payload.payment.entity;
      // Update order status based on razorpayOrderId
      const updatedOrder = await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { paymentStatus: "Paid", isPaid: true, paymentId: payment.id },
        { new: true }
      );
      console.log("Order updated from webhook:", updatedOrder);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
