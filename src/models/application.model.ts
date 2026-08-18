import { Schema, model, Document, Types } from "mongoose";

export type ApplicationStatus = "pending" | "hired" | "rejected";

export interface IApplication extends Document {
  _id: Types.ObjectId;
  tuitionPost: Types.ObjectId;
  tutor: Types.ObjectId;
  coverMessage: string;
  expectedSalary: number;
  availability: string;
  status: ApplicationStatus;
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
  },
  { timestamps: true }
);

// A tutor may only apply once to a given post.
applicationSchema.index({ tuitionPost: 1, tutor: 1 }, { unique: true });

export const Application = model<IApplication>("Application", applicationSchema);
