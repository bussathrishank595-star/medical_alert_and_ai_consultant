import Medicine from "../models/Medicine.js";
import Order from "../models/Order.js";
import asyncHandler from "../utils/asyncHandler.js";

const UPI_ID = process.env.UPI_ID || "7989971353@ybl";

const normalizeItemQuantity = (value) => Math.max(Number.parseInt(value, 10) || 1, 1);

const rollbackStock = async (adjustments) => {
  for (const adjustment of adjustments.reverse()) {
    await Medicine.updateOne({ _id: adjustment.medicineId }, { $inc: { stock: adjustment.quantity } });
  }
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items, address, location = {}, paymentMode, notes = "" } = req.body;
  const cleanAddress = String(address || "").trim();
  const cleanNotes = String(notes || "").trim();
  const normalizedPaymentMode = paymentMode === "online" ? "online" : "cash";
  const cartItems = Array.isArray(items) ? items : [];

  if (!cleanAddress) {
    const error = new Error("Please enter a delivery address");
    error.statusCode = 400;
    throw error;
  }

  const orderItems = [];
  const stockAdjustments = [];

  try {
    for (const item of cartItems) {
      const medicineId = item.medicineId || item._id;
      const quantity = normalizeItemQuantity(item.quantity);
      const medicine = await Medicine.findById(medicineId);

      if (!medicine) {
        const error = new Error("One of the medicines in your cart is no longer available");
        error.statusCode = 404;
        throw error;
      }

      if (medicine.stock < quantity) {
        const error = new Error(`Not enough stock for ${medicine.name}`);
        error.statusCode = 400;
        throw error;
      }

      if (new Date(medicine.expiryDate) <= new Date()) {
        const error = new Error(`${medicine.name} is expired and cannot be ordered`);
        error.statusCode = 400;
        throw error;
      }

      medicine.stock -= quantity;
      await medicine.save();
      stockAdjustments.push({ medicineId: medicine._id, quantity });

      orderItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        category: medicine.category,
        image: medicine.image,
        price: medicine.price,
        quantity
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const paymentStatus = normalizedPaymentMode === "online" ? "Pending Verification" : "Cash on Delivery";
    const order = await Order.create({
      userId: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      items: orderItems,
      address: cleanAddress,
      location: {
        latitude: location.latitude !== undefined && location.latitude !== null ? Number(location.latitude) : undefined,
        longitude: location.longitude !== undefined && location.longitude !== null ? Number(location.longitude) : undefined
      },
      paymentMode: normalizedPaymentMode,
      paymentStatus,
      upiId: normalizedPaymentMode === "online" ? UPI_ID : "",
      subtotal,
      total: subtotal,
      notes: cleanNotes
    });

    res.status(201).json({
      message:
        normalizedPaymentMode === "online"
          ? `Order placed. Please complete the UPI payment using ${UPI_ID}.`
          : "Order placed successfully. We will contact you shortly.",
      order,
      upiId: UPI_ID
    });
  } catch (error) {
    await rollbackStock(stockAdjustments);
    throw error;
  }
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20);
  res.json({ orders });
});

export const getAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
  res.json({ orders });
});
