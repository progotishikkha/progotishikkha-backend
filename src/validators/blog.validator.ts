import { z } from "zod";

export const createBlogSchema = z.object({
  title: z.string().trim().min(5).max(200),
  content: z.string().trim().min(50),
  excerpt: z.string().trim().max(300).optional(),
  category: z.string().trim().min(1, "Category is required"),
  status: z.enum(["draft", "published"]).default("draft"),
  metaTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(160).optional(),
});

export const updateBlogSchema = createBlogSchema.partial();

export const createCommentSchema = z.object({
  content: z.string().trim().min(2).max(1000),
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
