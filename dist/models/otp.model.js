"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Otp = void 0;
const mongoose_1 = require("mongoose");
const otpSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["verify_email", "reset_password"], required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
// MongoDB TTL index — documents are auto-deleted once expiresAt passes.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ user: 1, purpose: 1 });
exports.Otp = (0, mongoose_1.model)("Otp", otpSchema);
//# sourceMappingURL=otp.model.js.map