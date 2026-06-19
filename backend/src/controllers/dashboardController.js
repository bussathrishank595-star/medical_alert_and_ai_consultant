import Medicine from "../models/Medicine.js";
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
    alerts
  ] = await Promise.all([
    Medicine.countDocuments(),
    Medicine.countDocuments({ expiryDate: { $lte: now } }),
    Medicine.countDocuments({ expiryDate: { $gt: now, $lte: soon } }),
    User.countDocuments(),
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
    Medicine.find({ expiryDate: { $lte: soon } }).sort({ expiryDate: 1 }).limit(20)
  ]);

  res.json({
    cards: {
      totalMedicines,
      expiredMedicines,
      expiringSoonMedicines,
      totalUsers,
      totalStock: stockAggregation[0]?.totalStock || 0
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
    }))
  });
});
