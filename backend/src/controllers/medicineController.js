import Medicine from "../models/Medicine.js";
import { getExpiryStatus } from "../services/expiryService.js";
import { buildMedicineProfile, generateMedicineImage } from "../services/openaiService.js";
import asyncHandler from "../utils/asyncHandler.js";

const buildMedicineQuery = (query) => {
  const filter = {};

  if (query.category) {
    filter.category = query.category;
  }

  if (query.status) {
    filter.expiryStatus = query.status;
  }

  if (query.q) {
    filter.$text = { $search: query.q };
  }

  return filter;
};

export const getMedicines = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
  const filter = buildMedicineQuery(req.query);

  const [medicines, total] = await Promise.all([
    Medicine.find(filter)
      .sort(req.query.q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Medicine.countDocuments(filter)
  ]);

  res.json({
    medicines,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    const error = new Error("Medicine not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({ medicine });
});

export const createMedicine = asyncHandler(async (req, res) => {
  const name = String(req.body.name).trim();
  const manufacturer = String(req.body.manufacturer).trim();
  const descriptionHint = String(req.body.description || "").trim();
  const profile = await buildMedicineProfile({ name, manufacturer, descriptionHint });
  const manualImage = String(req.body.image || "").trim();
  const image = manualImage || (await generateMedicineImage({ name, category: profile.category, manufacturer, imagePrompt: profile.imagePrompt }));
  const medicine = await Medicine.create({
    ...req.body,
    name,
    manufacturer,
    description: profile.description,
    image,
    category: profile.category,
    symptoms: profile.symptoms,
    aiClassification: {
      category: profile.category,
      symptoms: profile.symptoms,
      description: profile.description,
      usage: profile.usage,
      warnings: profile.warnings,
      imagePrompt: profile.imagePrompt,
      imageSource: manualImage ? "admin" : "ai",
      raw: profile.raw
    },
    expiryStatus: getExpiryStatus(req.body.expiryDate)
  });

  res.status(201).json({ medicine });
});

export const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    const error = new Error("Medicine not found");
    error.statusCode = 404;
    throw error;
  }

  const name = req.body.name !== undefined ? String(req.body.name).trim() : medicine.name;
  const manufacturer = req.body.manufacturer !== undefined ? String(req.body.manufacturer).trim() : medicine.manufacturer;
  const descriptionHint = String(req.body.description || "").trim();
  const manualImage = String(req.body.image || "").trim();
  const shouldRefreshProfile =
    req.body.forceClassify === true ||
    req.body.name !== undefined ||
    req.body.manufacturer !== undefined ||
    !medicine.description ||
    !medicine.image ||
    !medicine.aiClassification?.usage ||
    !medicine.aiClassification?.imagePrompt;

  let generatedFields = {};

  if (shouldRefreshProfile) {
    const profile = await buildMedicineProfile({ name, manufacturer, descriptionHint });
    const image = manualImage || (await generateMedicineImage({ name, category: profile.category, manufacturer, imagePrompt: profile.imagePrompt }));
    generatedFields = {
      description: profile.description,
      image,
      category: profile.category,
      symptoms: profile.symptoms,
      aiClassification: {
        category: profile.category,
        symptoms: profile.symptoms,
        description: profile.description,
        usage: profile.usage,
        warnings: profile.warnings,
        imagePrompt: profile.imagePrompt,
        imageSource: manualImage ? "admin" : "ai",
        raw: profile.raw
      }
    };
  }

  const updates = { ...req.body };
  delete updates.description;
  if (!manualImage) {
    delete updates.image;
  }

  Object.assign(medicine, updates, generatedFields, {
    name,
    manufacturer,
    expiryStatus: getExpiryStatus(req.body.expiryDate || medicine.expiryDate)
  });

  if (!shouldRefreshProfile && manualImage) {
    medicine.image = manualImage;
    medicine.aiClassification = {
      ...(medicine.aiClassification || {}),
      imageSource: "admin"
    };
  }

  await medicine.save();
  res.json({ medicine });
});

export const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    const error = new Error("Medicine not found");
    error.statusCode = 404;
    throw error;
  }

  await medicine.deleteOne();
  res.json({ message: "Medicine deleted" });
});

export const getClassificationLogs = asyncHandler(async (_req, res) => {
  const logs = await Medicine.find({}, "name category symptoms aiClassification createdAt").sort({ createdAt: -1 });
  res.json({ logs });
});
