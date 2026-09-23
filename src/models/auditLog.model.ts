import { Schema, model, Document, Types } from "mongoose";

// Fixed catalogue of auditable admin actions. Keeping this as a union (not a
// free-form string) means a typo in a controller can't silently produce an
// audit entry that later reporting/filtering can't find.
export type AuditAction =
  | "ADMIN_VERIFIED_TUTOR"
  | "ADMIN_REJECTED_TUTOR"
  | "ADMIN_VERIFIED_STUDENT"
  | "ADMIN_REJECTED_STUDENT"
  | "APPLICATION_HIRED"
  | "APPLICATION_REJECTED"
  | "CONNECTION_STARTED"
  | "APPLICATION_CONNECTED"
  | "CONNECTION_FAILED"
  | "CONNECTION_CANCELLED"
  | "DONATION_SALARY_RECEIVED"
  | "DONATION_APPROVED"
  | "DONATION_REJECTED"
  | "DONATION_MARKED_OVERDUE"
  | "TUTOR_SUSPENDED"
  | "TUTOR_REINSTATED"
  | "ADMIN_CONTACTED_STUDENT"
  | "ADMIN_CONTACTED_TUTOR"
  | "TUITION_POST_DELETED"
  | "USER_SUSPENDED"
  | "USER_UNSUSPENDED"
  | "USER_DELETED";

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actor: Types.ObjectId; // admin User._id who performed the action
  action: AuditAction;
  targetType: string; // e.g. "TutorProfile", "Application", "Donation", "User"
  targetId: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        "ADMIN_VERIFIED_TUTOR",
        "ADMIN_REJECTED_TUTOR",
        "ADMIN_VERIFIED_STUDENT",
        "ADMIN_REJECTED_STUDENT",
        "APPLICATION_HIRED",
        "APPLICATION_REJECTED",
        "CONNECTION_STARTED",
        "APPLICATION_CONNECTED",
        "CONNECTION_FAILED",
        "CONNECTION_CANCELLED",
        "DONATION_SALARY_RECEIVED",
        "DONATION_APPROVED",
        "DONATION_REJECTED",
        "DONATION_MARKED_OVERDUE",
        "TUTOR_SUSPENDED",
        "TUTOR_REINSTATED",
        "ADMIN_CONTACTED_STUDENT",
        "ADMIN_CONTACTED_TUTOR",
        "TUITION_POST_DELETED",
        "USER_SUSPENDED",
        "USER_UNSUSPENDED",
        "USER_DELETED",
      ],
    },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    // Never store passwords, tokens, OTPs, or full document dumps here —
    // only small, non-sensitive fields useful for a human reviewing history.
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
