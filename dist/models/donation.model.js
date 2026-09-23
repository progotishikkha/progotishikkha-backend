"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Donation = void 0;
const mongoose_1 = require("mongoose");
const donationSchema = new mongoose_1.Schema({
    tutor: { type: mongoose_1.Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    tuitionPost: { type: mongoose_1.Schema.Types.ObjectId, ref: "TuitionPost", required: true, index: true },
    application: { type: mongoose_1.Schema.Types.ObjectId, ref: "Application", required: true, unique: true, index: true },
    firstMonthSalary: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100, default: 10 },
    donationAmount: { type: Number, required: true, min: 0 },
    salaryReceivedAt: { type: Date },
    dueDate: { type: Date, index: true },
    status: {
        type: String,
        enum: ["not_due", "due", "payment_submitted", "completed", "rejected", "overdue", "suspended"],
        default: "not_due",
        index: true,
    },
    paymentMethod: { type: String, enum: ["bkash"] },
    transactionId: { type: String, trim: true, maxlength: 120 },
    paymentSubmittedAt: { type: Date },
    paidAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    reminderCount: { type: Number, default: 0, min: 0 },
    lastReminderAt: { type: Date },
    suspendedAt: { type: Date },
    adminNote: { type: String, maxlength: 1000 },
}, { timestamps: true });
donationSchema.index({ tutor: 1, status: 1 });
donationSchema.index({ dueDate: 1, status: 1 });
exports.Donation = (0, mongoose_1.model)("Donation", donationSchema);
//# sourceMappingURL=donation.model.js.map