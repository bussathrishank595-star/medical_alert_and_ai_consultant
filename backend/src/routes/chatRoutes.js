import express from "express";
import { getHistory, sendMessage } from "../controllers/chatController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { chatValidator } from "../validators/chatValidators.js";

const router = express.Router();

router.use(protect, authorize("customer", "admin"));
router.post("/", chatValidator, validate, sendMessage);
router.get("/history", getHistory);

export default router;
