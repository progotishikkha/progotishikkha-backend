"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationSalaryReceivedSchema = exports.donationVerificationSchema = exports.verificationActionSchema = exports.broadcastNotificationSchema = void 0;
const zod_1 = require("zod");
exports.broadcastNotificationSchema = zod_1.z.object({
    audience: zod_1.z.enum(["all", "students", "tutors"]),
    message: zod_1.z.string().trim().min(1).max(500),
});
exports.verificationActionSchema = zod_1.z.object({
    status: zod_1.z.enum(["verified", "rejected"]),
    note: zod_1.z.string().trim().max(1000).optional(),
});
exports.donationVerificationSchema = zod_1.z.object({
    approved: zod_1.z.boolean(),
    note: zod_1.z.string().trim().max(1000).optional(),
});
exports.donationSalaryReceivedSchema = zod_1.z.object({
    dueDate: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=admin.validator.js.map