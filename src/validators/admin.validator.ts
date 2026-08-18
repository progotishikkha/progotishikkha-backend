import { z } from "zod";

export const broadcastNotificationSchema = z.object({
  audience: z.enum(["all", "students", "tutors"]),
  message: z.string().trim().min(1).max(500),
});

export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
