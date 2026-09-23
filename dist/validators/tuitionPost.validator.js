"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tuitionFiltersSchema = exports.updateTuitionPostSchema = exports.createTuitionPostSchema = void 0;
const zod_1 = require("zod");
exports.createTuitionPostSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(5).max(150),
    class: zod_1.z.string().trim().min(1),
    medium: zod_1.z.string().trim().min(1),
    subject: zod_1.z.string().trim().min(1),
    daysPerWeek: zod_1.z.coerce.number().min(1).max(7),
    salary: zod_1.z.coerce.number().min(0),
    location: zod_1.z.string().trim().min(2),
    teachingMode: zod_1.z.enum(["online", "offline", "both"]),
    genderPreference: zod_1.z.enum(["male", "female", "any"]).default("any"),
    description: zod_1.z.string().trim().min(20).max(3000),
    preferredTutor: zod_1.z.string().trim().max(200).optional(),
    deadline: zod_1.z.coerce.date(),
});
exports.updateTuitionPostSchema = exports.createTuitionPostSchema.partial().extend({
    status: zod_1.z.enum(["open", "closed", "filled"]).optional(),
});
exports.tuitionFiltersSchema = zod_1.z.object({
    subject: zod_1.z.string().trim().optional(),
    location: zod_1.z.string().trim().optional(),
    medium: zod_1.z.string().trim().optional(),
    class: zod_1.z.string().trim().optional(),
    minSalary: zod_1.z.coerce.number().optional(),
    maxSalary: zod_1.z.coerce.number().optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(50).default(12),
});
//# sourceMappingURL=tuitionPost.validator.js.map