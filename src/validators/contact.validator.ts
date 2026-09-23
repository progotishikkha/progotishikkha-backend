import { z } from "zod";

export const createContactMessageSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(2000),
});

export const updateContactStatusSchema = z.object({
  status: z.enum(["new", "read", "resolved"]),
});

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;
