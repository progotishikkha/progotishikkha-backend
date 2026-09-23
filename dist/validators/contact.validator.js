"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContactStatusSchema = exports.createContactMessageSchema = void 0;
const zod_1 = require("zod");
exports.createContactMessageSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    email: zod_1.z.string().trim().toLowerCase().email(),
    subject: zod_1.z.string().trim().min(3).max(200),
    message: zod_1.z.string().trim().min(10).max(2000),
});
exports.updateContactStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["new", "read", "resolved"]),
});
//# sourceMappingURL=contact.validator.js.map