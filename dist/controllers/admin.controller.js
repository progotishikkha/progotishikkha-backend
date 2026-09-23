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
exports.listAudit = exports.broadcastNotification = exports.reinstateTutor = exports.suspendDonationTutor = exports.remindDonation = exports.markDonationOverdue = exports.verifyDonationPayment = exports.markDonationSalaryReceived = exports.listDonations = exports.getAnalytics = exports.deleteUser = exports.toggleSuspendUser = exports.cancelApplicationConnection = exports.markApplicationConnectionFailed = exports.markApplicationConnected = exports.startApplicationContact = exports.deleteTuitionPost = exports.getTuitionPostDetail = exports.listTuitionPosts = exports.getUserContact = exports.verifyStudent = exports.verifyTutor = exports.listTutors = exports.listStudents = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const adminService = __importStar(require("../services/admin.service"));
const auditLog_service_1 = require("../services/auditLog.service");
exports.listStudents = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const students = await adminService.listStudents();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, students));
});
exports.listTutors = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const tutors = await adminService.listTutors();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, tutors));
});
exports.verifyTutor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const status = req.body.status ?? "verified";
    const tutor = await adminService.verifyTutor(req.params.id, req.user.id, status, req.body.note);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, tutor, `Tutor ${status}`));
});
exports.verifyStudent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const student = await adminService.verifyStudent(req.params.id, req.user.id, req.body.status, req.body.note);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, student, `Student ${req.body.status}`));
});
exports.getUserContact = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const contact = await adminService.getUserContact(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, contact));
});
exports.listTuitionPosts = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const posts = await adminService.listTuitionPosts();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, posts));
});
exports.getTuitionPostDetail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const detail = await adminService.getTuitionPostDetail(req.params.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, detail));
});
exports.deleteTuitionPost = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    await adminService.deleteTuitionPost(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "Tuition post deleted"));
});
// --- Admin mediation / connection state machine (spec section 9) ---------
exports.startApplicationContact = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const application = await adminService.startApplicationContact(req.params.id, req.user.id, req.body.notes);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, application, "Contact started"));
});
exports.markApplicationConnected = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const application = await adminService.markApplicationConnected(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, application, "Student and tutor marked as connected"));
});
exports.markApplicationConnectionFailed = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const application = await adminService.markApplicationConnectionFailed(req.params.id, req.user.id, req.body.failureReason);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, application, "Connection marked as failed"));
});
exports.cancelApplicationConnection = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const application = await adminService.cancelApplicationConnection(req.params.id, req.user.id, req.body.reason);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, application, "Hire cancelled; tuition post reopened"));
});
// --- Users -----------------------------------------------------------------
exports.toggleSuspendUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const user = await adminService.toggleSuspendUser(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, user, "User status updated"));
});
exports.deleteUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    await adminService.deleteUser(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "User deleted"));
});
exports.getAnalytics = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const summary = await adminService.getAnalyticsSummary();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, summary));
});
// --- Donations ---------------------------------------------------------
exports.listDonations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const donations = await adminService.listDonations(req.query.status);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, donations));
});
exports.markDonationSalaryReceived = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const donation = await adminService.markDonationSalaryReceived(req.params.id, req.user.id, req.body.dueDate);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, donation, "Donation is now due"));
});
exports.verifyDonationPayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const donation = await adminService.verifyDonationPayment(req.params.id, req.user.id, req.body.approved, req.body.note);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, donation, req.body.approved ? "Donation payment verified" : "Donation payment rejected"));
});
exports.markDonationOverdue = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const donation = await adminService.markDonationOverdue(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, donation, "Donation marked overdue"));
});
exports.remindDonation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const donation = await adminService.remindDonation(req.params.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, donation, "Reminder sent"));
});
exports.suspendDonationTutor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const donation = await adminService.suspendDonationTutor(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, donation, "Tutor suspended"));
});
exports.reinstateTutor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const donation = await adminService.reinstateTutor(req.params.id, req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, donation, "Tutor reinstated"));
});
exports.broadcastNotification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await adminService.broadcastNotification(req.body);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, result, `Notification sent to ${result.recipientCount} user(s)`));
});
// --- Audit log (spec section 23) -------------------------------------------
exports.listAudit = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const logs = await (0, auditLog_service_1.listAuditLogs)({
        targetType: req.query.targetType,
        targetId: req.query.targetId,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, logs));
});
//# sourceMappingURL=admin.controller.js.map