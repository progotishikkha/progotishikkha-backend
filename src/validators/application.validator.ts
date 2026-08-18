import { z } from "zod";

export const applyToTuitionSchema = z.object({
  tuitionPostId: z.string().trim().min(1, "Tuition post is required"),
  coverMessage: z.string().trim().min(20).max(1000),
  expectedSalary: z.coerce.number().min(0),
  availability: z.string().trim().min(2).max(200),
});

export type ApplyToTuitionInput = z.infer<typeof applyToTuitionSchema>;
