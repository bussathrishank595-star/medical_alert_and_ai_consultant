import mongoose from "mongoose";

export const MEDICINE_CATEGORIES = [
  "Headache",
  "Fever",
  "Cold",
  "Cough",
  "Diabetes",
  "Blood Pressure",
  "Vitamin",
  "Pain Relief",
  "Skin Care",
  "Antibiotic",
  "Other"
];

const aiClassificationSchema = new mongoose.Schema(
  {
    category: { type: String, enum: MEDICINE_CATEGORIES, default: "Other" },
    symptoms: [{ type: String, trim: true, lowercase: true }],
    description: { type: String, default: "" },
    usage: { type: String, default: "" },
    warnings: { type: String, default: "" },
    imagePrompt: { type: String, default: "" },
    imageSource: { type: String, enum: ["ai", "admin", "fallback"], default: "ai" },
    raw: { type: mongoose.Schema.Types.Mixed }
  },
  { _id: false }
);

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    category: {
      type: String,
      enum: MEDICINE_CATEGORIES,
      default: "Other"
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    symptoms: [{ type: String, trim: true, lowercase: true }],
    manufacturer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    image: {
      type: String,
      trim: true,
      default: ""
    },
    expiryDate: {
      type: Date,
      required: true
    },
    expiryStatus: {
      type: String,
      enum: ["Active", "Expiring Soon", "Expired"],
      default: "Active"
    },
    aiClassification: {
      type: aiClassificationSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

medicineSchema.index({ name: "text", description: "text", symptoms: "text", category: "text" });
medicineSchema.index({ expiryDate: 1 });
medicineSchema.index({ category: 1 });

const Medicine = mongoose.model("Medicine", medicineSchema);

export default Medicine;
