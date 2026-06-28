import { body } from "express-validator";

export const orderValidator = [
  body("items").isArray({ min: 1 }).withMessage("Please add at least one medicine to the cart"),
  body("items.*.medicineId").isMongoId().withMessage("Invalid medicine in cart"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("address").trim().isLength({ min: 10 }).withMessage("Please enter a complete delivery address"),
  body("paymentMode").isIn(["cash", "online"]).withMessage("Select a valid payment mode"),
  body("location.latitude").optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
  body("location.longitude").optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
  body("notes").optional().trim().isLength({ max: 500 }).withMessage("Notes must be 500 characters or less")
];
