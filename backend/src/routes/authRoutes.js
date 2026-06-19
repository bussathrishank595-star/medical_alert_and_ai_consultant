import express from "express";
import { getMe, login, register, updateMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { loginValidator, profileValidator, registerValidator } from "../validators/authValidators.js";

const router = express.Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.get("/me", protect, getMe);
router.put("/me", protect, profileValidator, validate, updateMe);

export default router;
