import { Schema, model, Document, Types } from "mongoose";

export type UserRole = "student" | "tutor" | "admin";

interface RefreshSession {
  tokenHash: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  refreshSessions: RefreshSession[];
  // Set on registration, cleared once the account is verified. MongoDB's TTL
  // monitor auto-deletes the document when this date passes, so an account
  // that never completes OTP verification (e.g. because the OTP email could
  // not be delivered) doesn't permanently squat on the unique email/phone and
  // block the person from trying again.
  unverifiedExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const refreshSessionSchema = new Schema<RefreshSession>(
  {
    tokenHash: { type: String, required: true },
    userAgent: { type: String },
    ip: { type: String },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "tutor", "admin"],
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    refreshSessions: { type: [refreshSessionSchema], default: [], select: false },
    unverifiedExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
// Partial TTL index: only documents that currently HAVE unverifiedExpiresAt
// set are subject to auto-expiry. Verified accounts (where the field is
// unset back to null) are never touched by this index.
userSchema.index(
  { unverifiedExpiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { unverifiedExpiresAt: { $type: "date" } } }
);

export const User = model<IUser>("User", userSchema);
