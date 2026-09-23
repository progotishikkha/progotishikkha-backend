"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tutorFiltersSchema = exports.updateStudentProfileSchema = exports.updateTutorProfileSchema = void 0;
const zod_1 = require("zod");
const shared_validator_1 = require("./shared.validator");
// Account-level fields (live on the User document, not the profile
// document). Optional here because profile updates are partial/PATCH-style.
const contactFields = {
    fullName: zod_1.z.string().trim().min(2).max(100).optional(),
    phone: shared_validator_1.phoneSchema.optional(),
};
exports.updateTutorProfileSchema = zod_1.z.object({
    ...contactFields,
    qualification: zod_1.z.string().trim().max(150).optional(),
    university: zod_1.z.string().trim().max(150).optional(),
    department: zod_1.z.string().trim().max(150).optional(),
    experienceYears: zod_1.z.coerce.number().min(0).max(50).optional(),
    skills: zod_1.z.array(zod_1.z.string().trim()).optional(),
    subjects: zod_1.z.array(zod_1.z.string().trim()).optional(),
    location: zod_1.z.string().trim().max(150).optional(),
    availability: zod_1.z.enum(["weekdays", "weekends", "evenings", "flexible"]).optional(),
    // Same BD validation/normalization as the account phone — this is the
    // number used for the WhatsApp click-to-chat link, so it must be a real,
    // consistently-formatted number too.
    whatsappNumber: shared_validator_1.phoneSchema.optional(),
    about: zod_1.z.string().trim().max(2000).optional(),
});
exports.updateStudentProfileSchema = zod_1.z.object({
    ...contactFields,
    location: zod_1.z.string().trim().max(150).optional(),
    whatsappNumber: shared_validator_1.phoneSchema.optional(),
});
// GET /tutors — public marketplace search/filter/pagination.
exports.tutorFiltersSchema = zod_1.z.object({
    q: zod_1.z.string().trim().max(150).optional(), // matches tutor name, subjects, or location
    subject: zod_1.z.string().trim().max(150).optional(),
    location: zod_1.z.string().trim().max(150).optional(),
    availability: zod_1.z.enum(["weekdays", "weekends", "evenings", "flexible"]).optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(48).default(12),
});
//# sourceMappingURL=profile.validator.js.map