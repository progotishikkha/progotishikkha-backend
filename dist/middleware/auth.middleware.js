"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const token_service_1 = require("../services/token.service");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const user_model_1 = require("../models/user.model");
/** Verifies the JWT access token and attaches { id, role } to req.user. */
exports.protect = (0, asyncHandler_1.asyncHandler)(async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        throw ApiError_1.ApiError.unauthorized("Authentication token missing");
    }
    const token = header.split(" ")[1];
    let payload;
    try {
        payload = (0, token_service_1.verifyAccessToken)(token);
    }
    catch {
        throw ApiError_1.ApiError.unauthorized("Invalid or expired access token");
    }
    // Confirm the user still exists and hasn't been suspended/deactivated
    // since the token was issued.
    const user = await user_model_1.User.findById(payload.sub).select("isActive isSuspended role");
    if (!user || !user.isActive || user.isSuspended) {
        throw ApiError_1.ApiError.unauthorized("Account is no longer active");
    }
    req.user = { id: payload.sub, role: payload.role };
    next();
});
/** Restricts a route to the given roles. Must run after `protect`. */
const authorize = (...roles) => (req, _res, next) => {
    if (!req.user) {
        return next(ApiError_1.ApiError.unauthorized("Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
        return next(ApiError_1.ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map