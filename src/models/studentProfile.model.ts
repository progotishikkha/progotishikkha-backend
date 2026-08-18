import { Schema, model, Document, Types } from "mongoose";

export interface IStudentProfile extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  location?: string;
  whatsappNumber?: string;
  profilePhoto?: { url: string; publicId: string };
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
  },
  { timestamps: true }
);

export const StudentProfile = model<IStudentProfile>("StudentProfile", studentProfileSchema);
