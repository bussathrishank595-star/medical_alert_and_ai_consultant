import ChatHistory from "../models/ChatHistory.js";
import Medicine from "../models/Medicine.js";
import { findMatchingMedicines, generateHealthResponse } from "../services/openaiService.js";
import asyncHandler from "../utils/asyncHandler.js";

const buildRecommendations = (medicines) =>
  medicines.map((medicine) => ({
    medicineId: medicine._id,
    name: medicine.name,
    usage: medicine.aiClassification?.usage || medicine.description,
    precautions: medicine.aiClassification?.warnings || "Follow label instructions and consult a doctor if unsure."
  }));

export const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const activeMedicines = await Medicine.find({
    stock: { $gt: 0 },
    expiryDate: { $gt: new Date() }
  }).sort({ name: 1 });

  const matchedMedicines = findMatchingMedicines(message, activeMedicines);
  const response = await generateHealthResponse({ message, matchedMedicines });
  const recommendations = buildRecommendations(matchedMedicines);

  const history = await ChatHistory.create({
    userId: req.user._id,
    message,
    response,
    recommendations
  });

  res.status(201).json({ response, recommendations, historyId: history._id });
});

export const getHistory = asyncHandler(async (req, res) => {
  const history = await ChatHistory.find({ userId: req.user._id })
    .populate("recommendations.medicineId", "name price image stock expiryDate category")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ history });
});
