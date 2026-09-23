"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyToTuitionSchema = void 0;
const zod_1 = require("zod");
exports.applyToTuitionSchema = zod_1.z.object({
    tuitionPostId: zod_1.z.string().trim().min(1, "Tuition post is required"),
    coverMessage: zod_1.z.string().trim().min(20).max(1000),
    expectedSalary: zod_1.z.coerce.number().min(0),
    availability: zod_1.z.string().trim().min(2).max(200),
});
//# sourceMappingURL=application.validator.js.map