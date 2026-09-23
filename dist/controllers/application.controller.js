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
exports.listSaved = exports.unsave = exports.save = exports.reject = exports.hire = exports.listForPost = exports.listMine = exports.apply = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const applicationService = __importStar(require("../services/application.service"));
exports.apply = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const application = await applicationService.applyToTuition(req.user.id, req.body);
    res.status(201).json(new ApiResponse_1.ApiResponse(201, application, "Application submitted"));
});
exports.listMine = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const applications = await applicationService.listMyApplications(req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, applications));
});
exports.listForPost = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const applications = await applicationService.listApplicationsForPost(req.params.postId, req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, applications));
});
exports.hire = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const application = await applicationService.hireApplicant(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, application, "Tutor hired"));
});
exports.reject = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const application = await applicationService.rejectApplicant(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, application, "Applicant rejected"));
});
exports.save = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    await applicationService.saveTuition(req.user.id, req.params.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "Tuition saved"));
});
exports.unsave = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    await applicationService.unsaveTuition(req.user.id, req.params.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "Tuition removed from saved"));
});
exports.listSaved = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const saved = await applicationService.listSavedTuitions(req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, saved));
});
//# sourceMappingURL=application.controller.js.map