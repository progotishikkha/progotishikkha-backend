import { Schema, model, Document, Types } from "mongoose";

export type BlogStatus = "draft" | "published";

export interface IBlog extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: Types.ObjectId;
  featuredImage?: { url: string; publicId: string };
  author: Types.ObjectId;
  status: BlogStatus;
  metaTitle?: string;
  metaDescription?: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    content: { type: String, required: true },
    excerpt: { type: String, maxlength: 300 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    featuredImage: {
      url: { type: String },
      publicId: { type: String },
    },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    metaTitle: { type: String, maxlength: 70 },
    metaDescription: { type: String, maxlength: 160 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogSchema.index({ title: "text", content: "text" });

export const Blog = model<IBlog>("Blog", blogSchema);
