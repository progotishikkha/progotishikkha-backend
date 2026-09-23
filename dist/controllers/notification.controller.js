"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.listNotifications = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const notification_model_1 = require("../models/notification.model");
exports.listNotifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const notifications = await notification_model_1.Notification.find({ recipient: req.user.id })
        .sort({ createdAt: -1 })
        .limit(50);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, notifications));
});
exports.markAsRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const notification = await notification_model_1.Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user.id }, { isRead: true }, { new: true });
    if (!notification)
        throw ApiError_1.ApiError.notFound("Notification not found");
    res.status(200).json(new ApiResponse_1.ApiResponse(200, notification));
});
exports.markAllAsRead = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    await notification_model_1.Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "All notifications marked as read"));
});
exports.deleteNotification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    // Ownership check via the query itself (recipient: req.user.id) — this can
    // never delete another user's notification: if the id exists but belongs
    // to someone else, the filter simply matches nothing and we 404, exactly
    // like the existing markAsRead handler above.
    const notification = await notification_model_1.Notification.findOneAndDelete({
        _id: req.params.id,
        recipient: req.user.id,
    });
    if (!notification)
        throw ApiError_1.ApiError.notFound("Notification not found");
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "Notification deleted"));
});
//# sourceMappingURL=notification.controller.js.map