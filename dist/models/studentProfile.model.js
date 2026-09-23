"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProfile = void 0;
const mongoose_1 = require("mongoose");
const studentProfileSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    location: { type: String, trim: true },
    whatsappNumber: { type: String, trim: true },
    profilePhoto: {
        url: { type: String },
        publicId: { type: String },
    },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending", index: true },
    verificationRequestedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    verificationNote: { type: String, maxlength: 1000 },
}, { timestamps: true });
exports.StudentProfile = (0, mongoose_1.model)("StudentProfile", studentProfileSchema);
//# sourceMappingURL=studentProfile.model.js.map