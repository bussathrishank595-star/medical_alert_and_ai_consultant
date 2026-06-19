import express from "express";
import { getUsers, updateUserRole } from "../controllers/userController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/", getUsers);
router.patch("/:id/role", updateUserRole);

export default router;
