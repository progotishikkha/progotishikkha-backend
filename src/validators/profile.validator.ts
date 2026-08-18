import { z } from "zod";
import { phoneSchema } from "./shared.validator";

// Account-level fields (live on the User document, not the profile
// document). Optional here because profile updates are partial/PATCH-style.
const contactFields = {
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: phoneSchema.optional(),
};

export const updateTutorProfileSchema = z.object({
  ...contactFields,
  qualification: z.string().trim().max(150).optional(),
  university: z.string().trim().max(150).optional(),
  department: z.string().trim().max(150).optional(),
  experienceYears: z.coerce.number().min(0).max(50).optional(),
  skills: z.array(z.string().trim()).optional(),
  subjects: z.array(z.string().trim()).optional(),
  location: z.string().trim().max(150).optional(),
  availability: z.enum(["weekdays", "weekends", "evenings", "flexible"]).optional(),
  // Same BD validation/normalization as the account phone — this is the
  // number used for the WhatsApp click-to-chat link, so it must be a real,
  // consistently-formatted number too.
  whatsappNumber: phoneSchema.optional(),
  about: z.string().trim().max(2000).optional(),
});

export const updateStudentProfileSchema = z.object({
  ...contactFields,
  location: z.string().trim().max(150).optional(),
  whatsappNumber: phoneSchema.optional(),
});

export type UpdateTutorProfileInput = z.infer<typeof updateTutorProfileSchema>;
export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;

// GET /tutors — public marketplace search/filter/pagination.
export const tutorFiltersSchema = z.object({
  q: z.string().trim().max(150).optional(), // matches tutor name, subjects, or location
  subject: z.string().trim().max(150).optional(),
  location: z.string().trim().max(150).optional(),
  availability: z.enum(["weekdays", "weekends", "evenings", "flexible"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(48).default(12),
});

export type TutorFiltersInput = z.infer<typeof tutorFiltersSchema>;
