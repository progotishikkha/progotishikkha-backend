import { Schema, model, Document, Types } from "mongoose";

export type OtpPurpose = "verify_email" | "reset_password";

export interface IOtp extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  codeHash: string;
  purpose: OtpPurpose;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["verify_email", "reset_password"], required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// MongoDB TTL index — documents are auto-deleted once expiresAt passes.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ user: 1, purpose: 1 });

export const Otp = model<IOtp>("Otp", otpSchema);
