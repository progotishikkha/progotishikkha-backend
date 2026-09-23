import { Schema, model, Document, Types } from "mongoose";

export type DonationStatus =
  | "not_due"
  | "due"
  | "payment_submitted"
  | "completed"
  | "rejected"
  | "overdue"
  | "suspended";

export interface IDonation extends Document {
  _id: Types.ObjectId;
  tutor: Types.ObjectId;
  tuitionPost: Types.ObjectId;
  application: Types.ObjectId;
  firstMonthSalary: number;
  percentage: number;
  donationAmount: number;
  salaryReceivedAt?: Date;
  dueDate?: Date;
  status: DonationStatus;
  paymentMethod?: "bkash";
  transactionId?: string;
  paymentSubmittedAt?: Date;
  paidAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  reminderCount: number;
  lastReminderAt?: Date;
  suspendedAt?: Date;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<IDonation>(
  {
    tutor: { type: Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    tuitionPost: { type: Schema.Types.ObjectId, ref: "TuitionPost", required: true, index: true },
    application: { type: Schema.Types.ObjectId, ref: "Application", required: true, unique: true, index: true },
    firstMonthSalary: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100, default: 10 },
    donationAmount: { type: Number, required: true, min: 0 },
    salaryReceivedAt: { type: Date },
    dueDate: { type: Date, index: true },
    status: {
      type: String,
      enum: ["not_due", "due", "payment_submitted", "completed", "rejected", "overdue", "suspended"],
      default: "not_due",
      index: true,
    },
    paymentMethod: { type: String, enum: ["bkash"] },
    transactionId: { type: String, trim: true, maxlength: 120 },
    paymentSubmittedAt: { type: Date },
    paidAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reminderCount: { type: Number, default: 0, min: 0 },
    lastReminderAt: { type: Date },
    suspendedAt: { type: Date },
    adminNote: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

donationSchema.index({ tutor: 1, status: 1 });
donationSchema.index({ dueDate: 1, status: 1 });

export const Donation = model<IDonation>("Donation", donationSchema);
