import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!["admin", "customer"].includes(role)) {
    const error = new Error("Role must be admin or customer");
    error.statusCode = 422;
    throw error;
  }

  if (String(req.user._id) === String(req.params.id) && role !== "admin") {
    const error = new Error("You cannot remove your own admin role");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.json({ user });
});
