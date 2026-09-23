"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorProfile = void 0;
const mongoose_1 = require("mongoose");
const tutorProfileSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    isApproved: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending", index: true },
    verificationRequestedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    verificationNote: { type: String, maxlength: 1000 },
    profilePhoto: {
        url: { type: String },
        publicId: { type: String },
    },
    qualification: { type: String, trim: true },
    university: { type: String, trim: true },
    department: { type: String, trim: true },
    experienceYears: { type: Number, min: 0, default: 0 },
    skills: { type: [String], default: [] },
    subjects: { type: [String], default: [], index: true },
    location: { type: String, trim: true, index: true },
    availability: {
        type: String,
        enum: ["weekdays", "weekends", "evenings", "flexible"],
    },
    whatsappNumber: { type: String, trim: true },
    about: { type: String, maxlength: 2000 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    completedTuitionCount: { type: Number, default: 0 },
}, { timestamps: true });
tutorProfileSchema.index({ isApproved: 1, rating: -1 });
exports.TutorProfile = (0, mongoose_1.model)("TutorProfile", tutorProfileSchema);
//# sourceMappingURL=tutorProfile.model.js.map