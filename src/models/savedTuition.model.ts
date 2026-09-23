import { Schema, model, Document, Types } from "mongoose";

export interface ISavedTuition extends Document {
  _id: Types.ObjectId;
  tutor: Types.ObjectId;
  tuitionPost: Types.ObjectId;
  createdAt: Date;
}

const savedTuitionSchema = new Schema<ISavedTuition>(
  {
    tutor: { type: Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    tuitionPost: { type: Schema.Types.ObjectId, ref: "TuitionPost", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

savedTuitionSchema.index({ tutor: 1, tuitionPost: 1 }, { unique: true });

export const SavedTuition = model<ISavedTuition>("SavedTuition", savedTuitionSchema);
