"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const multer_1 = require("multer");
const ApiError_1 = require("../utils/ApiError");
const env_1 = require("../config/env");
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) => {
    let error = err;
    // Normalize known error types into ApiError
    if (error instanceof zod_1.ZodError) {
        error = ApiError_1.ApiError.badRequest("Validation failed", error.flatten().fieldErrors);
    }
    else if (error instanceof mongoose_1.default.Error.ValidationError) {
        error = ApiError_1.ApiError.badRequest("Validation failed", error.errors);
    }
    else if (error instanceof mongoose_1.default.Error.CastError) {
        error = ApiError_1.ApiError.badRequest(`Invalid ${error.path}: ${error.value}`);
    }
    else if (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000) {
        const keyValue = error.keyValue;
        const field = keyValue ? Object.keys(keyValue)[0] : "field";
        error = ApiError_1.ApiError.conflict(`${field} already exists`);
    }
    else if (error instanceof multer_1.MulterError) {
        // e.g. file too large / wrong field name during a photo upload — surface
        // these as a normal 400 instead of falling through to a 500.
        error =
            error.code === "LIMIT_FILE_SIZE"
                ? ApiError_1.ApiError.badRequest("File is too large (max 2MB)")
                : ApiError_1.ApiError.badRequest(error.message);
    }
    else if (error instanceof Error && error.name === "JsonWebTokenError") {
        error = ApiError_1.ApiError.unauthorized("Invalid token");
    }
    else if (error instanceof Error && error.name === "TokenExpiredError") {
        error = ApiError_1.ApiError.unauthorized("Token expired");
    }
    else if (!(error instanceof ApiError_1.ApiError)) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        error = ApiError_1.ApiError.internal(message);
    }
    const apiError = error;
    // eslint-disable-next-line no-console
    if (!env_1.isProd)
        console.error(apiError);
    res.status(apiError.statusCode).json({
        success: false,
        statusCode: apiError.statusCode,
        message: apiError.message,
        errors: apiError.errors ?? undefined,
        stack: env_1.isProd ? undefined : apiError.stack,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map