"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    isOperational;
    errors;
    constructor(statusCode, message, errors, stack) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errors = errors;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    static badRequest(message = "Bad Request", errors) {
        return new ApiError(400, message, errors);
    }
    static unauthorized(message = "Unauthorized") {
        return new ApiError(401, message);
    }
    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }
    static notFound(message = "Resource not found") {
        return new ApiError(404, message);
    }
    static conflict(message = "Conflict") {
        return new ApiError(409, message);
    }
    static tooManyRequests(message = "Too many requests") {
        return new ApiError(429, message);
    }
    static internal(message = "Internal Server Error") {
        return new ApiError(500, message);
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=ApiError.js.map