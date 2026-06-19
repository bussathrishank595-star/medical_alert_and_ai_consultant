import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const buildToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const sendAuthResponse = (res, user, statusCode = 200) => {
  res.status(statusCode).json({
    token: buildToken(user._id),
    user
  });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const role = adminEmails().includes(email.toLowerCase()) ? "admin" : "customer";
  const user = await User.create({ name, email, password, role });

  sendAuthResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  sendAuthResponse(res, user);
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const updates = {};

  if (req.body.name) {
    updates.name = req.body.name;
  }

  if (req.body.password) {
    updates.password = req.body.password;
  }

  const user = await User.findById(req.user._id).select("+password");
  Object.assign(user, updates);
  await user.save();

  res.json({ user });
});
