"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const refreshSessionSchema = new mongoose_1.Schema({
    tokenHash: { type: String, required: true },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
}, { _id: false });
const userSchema = new mongoose_1.Schema({
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
        type: String,
        enum: ["student", "tutor", "admin"],
        required: true,
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    refreshSessions: { type: [refreshSessionSchema], default: [], select: false },
    unverifiedExpiresAt: { type: Date, default: null },
}, { timestamps: true });
userSchema.index({ role: 1 });
// Partial TTL index: only documents that currently HAVE unverifiedExpiresAt
// set are subject to auto-expiry. Verified accounts (where the field is
// unset back to null) are never touched by this index.
userSchema.index({ unverifiedExpiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { unverifiedExpiresAt: { $type: "date" } } });
exports.User = (0, mongoose_1.model)("User", userSchema);
//# sourceMappingURL=user.model.js.map