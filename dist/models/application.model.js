"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const mongoose_1 = require("mongoose");
const applicationSchema = new mongoose_1.Schema({
    tuitionPost: { type: mongoose_1.Schema.Types.ObjectId, ref: "TuitionPost", required: true, index: true },
    tutor: { type: mongoose_1.Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    coverMessage: { type: String, required: true, maxlength: 1000 },
    expectedSalary: { type: Number, required: true, min: 0 },
    availability: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "hired", "rejected"], default: "pending", index: true },
    connectionStatus: {
        type: String,
        enum: ["not_connected", "pending_admin", "contacting", "connected", "failed", "cancelled"],
        default: "not_connected",
        index: true,
    },
    connectedAt: { type: Date },
    connectedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    contactAttemptedAt: { type: Date },
    contactStartedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    contactNotes: { type: String, maxlength: 1000, select: false },
    failureReason: { type: String, maxlength: 500 },
}, { timestamps: true });
// A tutor may only apply once to a given post.
applicationSchema.index({ tuitionPost: 1, tutor: 1 }, { unique: true });
exports.Application = (0, mongoose_1.model)("Application", applicationSchema);
//# sourceMappingURL=application.model.js.map