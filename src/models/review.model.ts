import { Schema, model, Document, Types } from "mongoose";

export interface IReview extends Document {
  _id: Types.ObjectId;
  tutor: Types.ObjectId;
  student: Types.ObjectId;
  tuitionPost: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    tutor: { type: Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    tuitionPost: { type: Schema.Types.ObjectId, ref: "TuitionPost", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

// One review per student per completed tuition post.
reviewSchema.index({ tuitionPost: 1, student: 1 }, { unique: true });

export const Review = model<IReview>("Review", reviewSchema);
