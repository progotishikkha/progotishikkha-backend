"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    recipient: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
        type: String,
        enum: ["new_application", "tutor_hired", "tutor_rejected", "new_review", "new_match", "hire_request", "system"],
        required: true,
    },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    relatedId: { type: mongoose_1.Schema.Types.ObjectId },
}, { timestamps: { createdAt: true, updatedAt: false } });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
exports.Notification = (0, mongoose_1.model)("Notification", notificationSchema);
//# sourceMappingURL=notification.model.js.map