import { Schema, model, Document, Types } from "mongoose";

export type TeachingMode = "online" | "offline" | "both";
export type GenderPreference = "male" | "female" | "any";
export type TuitionStatus = "open" | "closed" | "filled";

export interface ITuitionPost extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  title: string;
  class: string;
  medium: string;
  subject: string;
  daysPerWeek: number;
  salary: number;
  location: string;
  teachingMode: TeachingMode;
  genderPreference: GenderPreference;
  description: string;
  preferredTutor?: string;
  status: TuitionStatus;
  deadline: Date;
  hiredTutor?: Types.ObjectId; // set once a tutor is hired
  createdAt: Date;
  updatedAt: Date;
}

const tuitionPostSchema = new Schema<ITuitionPost>(
  {
    student: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    class: { type: String, required: true, trim: true, index: true },
    medium: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true, index: true },
    daysPerWeek: { type: Number, required: true, min: 1, max: 7 },
    salary: { type: Number, required: true, min: 0, index: true },
    location: { type: String, required: true, trim: true, index: true },
    teachingMode: { type: String, enum: ["online", "offline", "both"], required: true },
    genderPreference: { type: String, enum: ["male", "female", "any"], default: "any" },
    description: { type: String, required: true, maxlength: 3000 },
    preferredTutor: { type: String, trim: true },
    status: { type: String, enum: ["open", "closed", "filled"], default: "open", index: true },
    deadline: { type: Date, required: true },
    hiredTutor: { type: Schema.Types.ObjectId, ref: "TutorProfile" },
  },
  { timestamps: true }
);

tuitionPostSchema.index({ subject: 1, location: 1, status: 1 });
tuitionPostSchema.index({ title: "text", description: "text" });

export const TuitionPost = model<ITuitionPost>("TuitionPost", tuitionPostSchema);
