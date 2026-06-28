import ChatHistory from "../models/ChatHistory.js";
import Medicine from "../models/Medicine.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { daysUntil } from "../services/expiryService.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);

  const [
    totalMedicines,
    expiredMedicines,
    expiringSoonMedicines,
    totalUsers,
    stockAggregation,
    categoryDistribution,
    monthlyAdded,
    alerts,
    medicineRequests,
    totalOrders,
    pendingOrders,
    recentOrders
  ] = await Promise.all([
    Medicine.countDocuments(),
    Medicine.countDocuments({ expiryDate: { $lte: now } }),
    Medicine.countDocuments({ expiryDate: { $gt: now, $lte: soon } }),
    User.countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ status: "Pending" }),
    Medicine.aggregate([{ $group: { _id: null, totalStock: { $sum: "$stock" } } }]),
    Medicine.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Medicine.aggregate([
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]),
    Medicine.find({ expiryDate: { $lte: soon } }).sort({ expiryDate: 1 }).limit(20),
    ChatHistory.find({
      $or: [{ matchType: { $in: ["Alternative", "Reference", "Unavailable"] } }, { adminReminder: { $ne: "" } }]
    })
      .populate("recommendations.medicineId", "name price image stock expiryDate category")
      .sort({ createdAt: -1 })
      .limit(10),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  res.json({
    cards: {
      totalMedicines,
      expiredMedicines,
      expiringSoonMedicines,
      totalUsers,
      totalStock: stockAggregation[0]?.totalStock || 0,
      totalOrders,
      pendingOrders
    },
    charts: {
      categoryDistribution: categoryDistribution.map((item) => ({ category: item._id || "Other", count: item.count })),
      monthlyAdded: monthlyAdded.reverse().map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        count: item.count
      }))
    },
    alerts: alerts.map((medicine) => ({
      _id: medicine._id,
      name: medicine.name,
      expiryDate: medicine.expiryDate,
      status: daysUntil(medicine.expiryDate) <= 0 ? "Expired" : "Expiring Soon",
      daysRemaining: daysUntil(medicine.expiryDate),
      stock: medicine.stock
    })),
    medicineRequests: medicineRequests.map((request) => ({
      _id: request._id,
      message: request.message,
      response: request.response,
      adminReminder: request.adminReminder || "",
      matchType: request.matchType || (request.recommendations?.length ? "Alternative" : "Unavailable"),
      createdAt: request.createdAt,
      recommendations: (request.recommendations || []).map((recommendation) => ({
        medicineId: recommendation.medicineId,
        name: recommendation.name,
        usage: recommendation.usage,
        precautions: recommendation.precautions
      }))
    })),
    recentOrders: recentOrders.map((order) => ({
      _id: order._id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      address: order.address,
      location: order.location,
      paymentMode: order.paymentMode,
      paymentStatus: order.paymentStatus,
      status: order.status,
      notes: order.notes,
      total: order.total,
      subtotal: order.subtotal,
      upiId: order.upiId,
      items: (order.items || []).map((item) => ({
        medicineId: item.medicineId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        category: item.category
      })),
      createdAt: order.createdAt
    }))
  });
});
