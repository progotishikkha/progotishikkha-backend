"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.donationPaymentSchema = void 0;
const zod_1 = require("zod");
exports.donationPaymentSchema = zod_1.z.object({
    transactionId: zod_1.z.string().trim().min(3).max(120),
});
//# sourceMappingURL=donation.validator.js.map