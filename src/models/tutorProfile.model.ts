import { Schema, model, Document, Types } from "mongoose";

export type Availability = "weekdays" | "weekends" | "evenings" | "flexible";

export interface ITutorProfile extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  isApproved: boolean; // true once profile is complete (auto) or an admin manually approves/overrides
  profilePhoto?: { url: string; publicId: string };
  qualification?: string;
  university?: string;
  department?: string;
  experienceYears?: number;
  skills: string[];
  subjects: string[];
  location?: string;
  availability?: Availability;
  whatsappNumber?: string;
  about?: string;
  rating: number; // derived average, recalculated when a Review is created
  reviewCount: number;
  completedTuitionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const tutorProfileSchema = new Schema<ITutorProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    isApproved: { type: Boolean, default: false },
    profilePhoto: {
      url: { type: String },
      publicId: { type: String },
    },
    qualification: { type: String, trim: true },
    university: { type: String, trim: true },
    department: { type: String, trim: true },
    experienceYears: { type: Number, min: 0, default: 0 },
    skills: { type: [String], default: [] },
    subjects: { type: [String], default: [], index: true },
    location: { type: String, trim: true, index: true },
    availability: {
      type: String,
      enum: ["weekdays", "weekends", "evenings", "flexible"],
    },
    whatsappNumber: { type: String, trim: true },
    about: { type: String, maxlength: 2000 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    completedTuitionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tutorProfileSchema.index({ isApproved: 1, rating: -1 });

export const TutorProfile = model<ITutorProfile>("TutorProfile", tutorProfileSchema);
