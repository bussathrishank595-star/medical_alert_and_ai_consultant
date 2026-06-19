import { body } from "express-validator";

export const medicineValidator = [
  body("name").trim().isLength({ min: 2, max: 160 }).withMessage("Medicine name is required"),
  body("manufacturer").trim().isLength({ min: 2, max: 160 }).withMessage("Manufacturer is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be a positive integer"),
  body("expiryDate").isISO8601().toDate().withMessage("Expiry date must be a valid date"),
  body("description").optional({ checkFalsy: true }).isLength({ min: 5, max: 2000 }).withMessage("Description must be 5 to 2000 characters"),
  body("image").optional({ checkFalsy: true }).isURL().withMessage("Image must be a valid URL")
];
