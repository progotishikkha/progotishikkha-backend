import { Schema, model, Document, Types } from "mongoose";

export interface IPendingRegistration extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "student" | "tutor";
  otpHash: string;
  otpAttempts: number;
  otpExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

const pendingRegistrationSchema = new Schema<IPendingRegistration>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "tutor"], required: true },
    otpHash: { type: String, required: true },
    otpAttempts: { type: Number, default: 0 },
    otpExpiresAt: { type: Date, required: true },
    // Pending registrations are deliberately kept outside the User collection.
    // MongoDB TTL removes abandoned registrations automatically.
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
pendingRegistrationSchema.index({ email: 1 }, { unique: true });
pendingRegistrationSchema.index({ phone: 1 }, { unique: true });

export const PendingRegistration = model<IPendingRegistration>(
  "PendingRegistration",
  pendingRegistrationSchema
);
