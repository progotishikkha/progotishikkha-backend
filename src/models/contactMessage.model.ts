import { Schema, model, Document, Types } from "mongoose";

export type ContactStatus = "new" | "read" | "resolved";

export interface IContactMessage extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ["new", "read", "resolved"], default: "new", index: true },
  },
  { timestamps: true }
);

export const ContactMessage = model<IContactMessage>("ContactMessage", contactMessageSchema);
