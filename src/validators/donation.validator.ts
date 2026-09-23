import { z } from "zod";

export const donationPaymentSchema = z.object({
  transactionId: z.string().trim().min(3).max(120),
});

export type DonationPaymentInput = z.infer<typeof donationPaymentSchema>;
