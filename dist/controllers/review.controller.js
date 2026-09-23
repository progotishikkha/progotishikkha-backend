"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.listAllForAdmin = exports.listForTutor = exports.create = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const reviewService = __importStar(require("../services/review.service"));
exports.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const review = await reviewService.createReview(req.user.id, req.body);
    res.status(201).json(new ApiResponse_1.ApiResponse(201, review, "Review submitted"));
});
exports.listForTutor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const reviews = await reviewService.listReviewsForTutor(req.params.tutorId);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, reviews));
});
exports.listAllForAdmin = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const reviews = await reviewService.listAllReviewsForAdmin();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, reviews));
});
exports.remove = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await reviewService.deleteReview(req.params.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "Review deleted"));
});
//# sourceMappingURL=review.controller.js.map