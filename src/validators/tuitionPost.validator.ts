import { z } from "zod";

export const createTuitionPostSchema = z.object({
  title: z.string().trim().min(5).max(150),
  class: z.string().trim().min(1),
  medium: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  daysPerWeek: z.coerce.number().min(1).max(7),
  salary: z.coerce.number().min(0),
  location: z.string().trim().min(2),
  teachingMode: z.enum(["online", "offline", "both"]),
  genderPreference: z.enum(["male", "female", "any"]).default("any"),
  description: z.string().trim().min(20).max(3000),
  preferredTutor: z.string().trim().max(200).optional(),
  deadline: z.coerce.date(),
});

export const updateTuitionPostSchema = createTuitionPostSchema.partial().extend({
  status: z.enum(["open", "closed", "filled"]).optional(),
});

export const tuitionFiltersSchema = z.object({
  subject: z.string().trim().optional(),
  location: z.string().trim().optional(),
  medium: z.string().trim().optional(),
  class: z.string().trim().optional(),
  minSalary: z.coerce.number().optional(),
  maxSalary: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export type CreateTuitionPostInput = z.infer<typeof createTuitionPostSchema>;
export type UpdateTuitionPostInput = z.infer<typeof updateTuitionPostSchema>;
export type TuitionFiltersInput = z.infer<typeof tuitionFiltersSchema>;
