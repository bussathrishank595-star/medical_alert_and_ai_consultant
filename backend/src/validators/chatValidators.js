import { body } from "express-validator";

export const chatValidator = [
  body("message").trim().isLength({ min: 3, max: 2000 }).withMessage("Message must be between 3 and 2000 characters")
];
