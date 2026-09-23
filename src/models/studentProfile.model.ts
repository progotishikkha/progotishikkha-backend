import { Schema, model, Document, Types } from "mongoose";

export type StudentVerificationStatus = "pending" | "verified" | "rejected";

export interface IStudentProfile extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  location?: string;
  whatsappNumber?: string;
  profilePhoto?: { url: string; publicId: string };
  verificationStatus: StudentVerificationStatus;
  verificationRequestedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  verificationNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    location: { type: String, trim: true },
    whatsappNumber: { type: String, trim: true },
    profilePhoto: {
      url: { type: String },
      publicId: { type: String },
    },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending", index: true },
    verificationRequestedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verificationNote: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

export const StudentProfile = model<IStudentProfile>("StudentProfile", studentProfileSchema);
