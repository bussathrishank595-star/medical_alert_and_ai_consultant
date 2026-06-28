import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: "Other"
    },
    image: {
      type: String,
      default: ""
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "At least one medicine is required"
      }
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    location: {
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      }
    },
    paymentMode: {
      type: String,
      enum: ["cash", "online"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Pending Verification", "Paid", "Cash on Delivery"],
      default: "Pending"
    },
    upiId: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Pending"
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
