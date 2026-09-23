import { z } from "zod";

export const createReviewSchema = z.object({
  tuitionPostId: z.string().trim().min(1),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
