"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = require("mongoose");
const auditLogSchema = new mongoose_1.Schema({
    actor: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: {
        type: String,
        required: true,
        index: true,
        enum: [
            "ADMIN_VERIFIED_TUTOR",
            "ADMIN_REJECTED_TUTOR",
            "ADMIN_VERIFIED_STUDENT",
            "ADMIN_REJECTED_STUDENT",
            "APPLICATION_HIRED",
            "APPLICATION_REJECTED",
            "CONNECTION_STARTED",
            "APPLICATION_CONNECTED",
            "CONNECTION_FAILED",
            "CONNECTION_CANCELLED",
            "DONATION_SALARY_RECEIVED",
            "DONATION_APPROVED",
            "DONATION_REJECTED",
            "DONATION_MARKED_OVERDUE",
            "TUTOR_SUSPENDED",
            "TUTOR_REINSTATED",
            "ADMIN_CONTACTED_STUDENT",
            "ADMIN_CONTACTED_TUTOR",
            "TUITION_POST_DELETED",
            "USER_SUSPENDED",
            "USER_UNSUSPENDED",
            "USER_DELETED",
        ],
    },
    targetType: { type: String, required: true },
    targetId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
    // Never store passwords, tokens, OTPs, or full document dumps here —
    // only small, non-sensitive fields useful for a human reviewing history.
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
exports.AuditLog = (0, mongoose_1.model)("AuditLog", auditLogSchema);
//# sourceMappingURL=auditLog.model.js.map