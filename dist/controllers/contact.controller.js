"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatus = exports.listAll = exports.submit = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const contactMessage_model_1 = require("../models/contactMessage.model");
exports.submit = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const message = await contactMessage_model_1.ContactMessage.create(req.body);
    res.status(201).json(new ApiResponse_1.ApiResponse(201, message, "Message sent — we'll get back to you soon."));
});
exports.listAll = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const messages = await contactMessage_model_1.ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, messages));
});
exports.updateStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const message = await contactMessage_model_1.ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!message)
        throw ApiError_1.ApiError.notFound("Message not found");
    res.status(200).json(new ApiResponse_1.ApiResponse(200, message, "Status updated"));
});
//# sourceMappingURL=contact.controller.js.map