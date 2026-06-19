export const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || res.statusCode || 500;
  let message = error.message || "Server error";

  if (error.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = "Duplicate value already exists";
  }

  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  res.status(statusCode).json({
    message,
    errors: error.errors,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });
};
