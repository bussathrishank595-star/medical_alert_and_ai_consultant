import { validationResult } from "express-validator";

const validate = (req, _res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.errors = errors.array();
    next(error);
    return;
  }

  next();
};

export default validate;
