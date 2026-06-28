import ChatHistory from "../models/ChatHistory.js";
import Medicine from "../models/Medicine.js";
import { findMatchingMedicines, generateHealthResponse } from "../services/openaiService.js";
import asyncHandler from "../utils/asyncHandler.js";

const buildRecommendations = (medicines) =>
  medicines
    .reduce((list, medicine) => {
      const key = String(medicine?._id || medicine?.name || "").toLowerCase();
      if (!key || list.seen.has(key)) {
        return list;
      }

      list.seen.add(key);
      list.items.push({
        medicineId: medicine._id || null,
        name: medicine.name,
        usage: medicine.aiClassification?.usage || medicine.description,
        precautions: medicine.aiClassification?.warnings || "Follow label instructions and consult a doctor if unsure.",
        referenceOnly: Boolean(medicine.referenceOnly || !medicine._id)
      });
      return list;
    }, { seen: new Set(), items: [] }).items;

export const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const activeMedicines = await Medicine.find({
    stock: { $gt: 0 },
    expiryDate: { $gt: new Date() }
  }).sort({ name: 1 });

  const matchedMedicines = findMatchingMedicines(message, activeMedicines);
  const responsePayload = await generateHealthResponse({ message, matchedMedicines, inventory: activeMedicines });
  const response = typeof responsePayload === "string" ? responsePayload : responsePayload.response;
  const suggestedMedicines = typeof responsePayload === "string" ? matchedMedicines : responsePayload.suggestedMedicines || matchedMedicines;
  const recommendations = buildRecommendations(suggestedMedicines);
  const adminReminder = typeof responsePayload === "string" ? "" : responsePayload.adminReminder || "";
  const matchType = typeof responsePayload === "string" ? (recommendations.length ? "Exact" : "Unavailable") : responsePayload.matchType || (recommendations.length ? "Exact" : "Unavailable");

  const history = await ChatHistory.create({
    userId: req.user._id,
    message,
    response,
    adminReminder,
    matchType,
    recommendations
  });

  res.status(201).json({ response, recommendations, historyId: history._id, adminReminder, matchType });
});

export const getHistory = asyncHandler(async (req, res) => {
  const history = await ChatHistory.find({ userId: req.user._id })
    .populate("recommendations.medicineId", "name price image stock expiryDate category")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ history });
});
