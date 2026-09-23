import { Schema, model, Document, Types } from "mongoose";

export type ApplicationStatus = "pending" | "hired" | "rejected";
// Admin-mediated connection state machine (spec section 9):
//   not_connected  -> initial state for every application (not yet hired)
//   pending_admin  -> student hired this tutor; waiting for admin to act
//   contacting     -> admin has started reaching out to student + tutor
//   connected      -> admin confirmed both sides are connected; tuition active
//   failed         -> admin attempted contact but the connection didn't work out
//   cancelled      -> hire/connection was cancelled before completion
export type ConnectionStatus = "not_connected" | "pending_admin" | "contacting" | "connected" | "failed" | "cancelled";

export interface IApplication extends Document {
  _id: Types.ObjectId;
  tuitionPost: Types.ObjectId;
  tutor: Types.ObjectId;
  coverMessage: string;
  expectedSalary: number;
  availability: string;
  status: ApplicationStatus;
  connectionStatus: ConnectionStatus;
  connectedAt?: Date;
  connectedBy?: Types.ObjectId;
  // Admin mediation audit trail — never exposed to student/tutor endpoints.
  contactAttemptedAt?: Date;
  contactStartedBy?: Types.ObjectId;
  contactNotes?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    tuitionPost: { type: Schema.Types.ObjectId, ref: "TuitionPost", required: true, index: true },
    tutor: { type: Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    coverMessage: { type: String, required: true, maxlength: 1000 },
    expectedSalary: { type: Number, required: true, min: 0 },
    availability: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "hired", "rejected"], default: "pending", index: true },
    connectionStatus: {
      type: String,
      enum: ["not_connected", "pending_admin", "contacting", "connected", "failed", "cancelled"],
      default: "not_connected",
      index: true,
    },
    connectedAt: { type: Date },
    connectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    contactAttemptedAt: { type: Date },
    contactStartedBy: { type: Schema.Types.ObjectId, ref: "User" },
    contactNotes: { type: String, maxlength: 1000, select: false },
    failureReason: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// A tutor may only apply once to a given post.
applicationSchema.index({ tuitionPost: 1, tutor: 1 }, { unique: true });

export const Application = model<IApplication>("Application", applicationSchema);
