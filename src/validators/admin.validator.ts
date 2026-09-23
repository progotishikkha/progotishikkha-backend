import { z } from "zod";

export const broadcastNotificationSchema = z.object({
  audience: z.enum(["all", "students", "tutors"]),
  message: z.string().trim().min(1).max(500),
});

export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;

export const verificationActionSchema = z.object({
  status: z.enum(["verified", "rejected"]),
  note: z.string().trim().max(1000).optional(),
});

export const donationVerificationSchema = z.object({
  approved: z.boolean(),
  note: z.string().trim().max(1000).optional(),
});

export const donationSalaryReceivedSchema = z.object({
  dueDate: z.string().datetime().optional(),
});
