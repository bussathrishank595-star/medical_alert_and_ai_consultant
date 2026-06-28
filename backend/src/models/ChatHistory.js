import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    response: {
      type: String,
      required: true
    },
    adminReminder: {
      type: String,
      default: ""
    },
    matchType: {
      type: String,
      enum: ["General", "Medical", "Exact", "Alternative", "Reference", "Unavailable"],
      default: "Exact"
    },
    recommendations: [
      {
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
        name: String,
        usage: String,
        precautions: String,
        referenceOnly: { type: Boolean, default: false }
      }
    ]
  },
  { timestamps: true }
);

chatHistorySchema.index({ userId: 1, createdAt: -1 });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

export default ChatHistory;
