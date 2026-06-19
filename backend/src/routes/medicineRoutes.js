import express from "express";
import {
  createMedicine,
  deleteMedicine,
  getClassificationLogs,
  getMedicineById,
  getMedicines,
  updateMedicine
} from "../controllers/medicineController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validate.js";
import { medicineValidator } from "../validators/medicineValidators.js";

const router = express.Router();

router.use(protect);
router.get("/", getMedicines);
router.get("/admin/classifications", authorize("admin"), getClassificationLogs);
router.get("/:id", getMedicineById);
router.post("/", authorize("admin"), medicineValidator, validate, createMedicine);
router.put("/:id", authorize("admin"), medicineValidator, validate, updateMedicine);
router.delete("/:id", authorize("admin"), deleteMedicine);

export default router;
