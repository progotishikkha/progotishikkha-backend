import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError";
import { isProd } from "../config/env";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let error = err;

  // Normalize known error types into ApiError
  if (error instanceof ZodError) {
    error = ApiError.badRequest("Validation failed", error.flatten().fieldErrors);
  } else if (error instanceof mongoose.Error.ValidationError) {
    error = ApiError.badRequest("Validation failed", error.errors);
  } else if (error instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid ${error.path}: ${error.value}`);
  } else if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  ) {
    const keyValue = (error as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : "field";
    error = ApiError.conflict(`${field} already exists`);
  } else if (error instanceof MulterError) {
    // e.g. file too large / wrong field name during a photo upload — surface
    // these as a normal 400 instead of falling through to a 500.
    error =
      error.code === "LIMIT_FILE_SIZE"
        ? ApiError.badRequest("File is too large (max 2MB)")
        : ApiError.badRequest(error.message);
  } else if (error instanceof Error && error.name === "JsonWebTokenError") {
    error = ApiError.unauthorized("Invalid token");
  } else if (error instanceof Error && error.name === "TokenExpiredError") {
    error = ApiError.unauthorized("Token expired");
  } else if (!(error instanceof ApiError)) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    error = ApiError.internal(message);
  }

  const apiError = error as ApiError;

  // eslint-disable-next-line no-console
  if (!isProd) console.error(apiError);

  res.status(apiError.statusCode).json({
    success: false,
    statusCode: apiError.statusCode,
    message: apiError.message,
    errors: apiError.errors ?? undefined,
    stack: isProd ? undefined : apiError.stack,
  });
};
