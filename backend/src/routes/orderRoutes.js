import express from "express";
import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { createOrder, getAllOrders, getMyOrders } from "../controllers/orderController.js";
import { orderValidator } from "../validators/orderValidators.js";

const router = express.Router();

router.use(protect);
router.post("/", authorize("customer"), orderValidator, validate, createOrder);
router.get("/mine", authorize("customer", "admin"), getMyOrders);
router.get("/admin", authorize("admin"), getAllOrders);

export default router;
