// Legacy analytics model retained for backward-compatible data. Direct
// student/tutor contact actions have been removed from the user-facing API;
// contact details are exposed only through admin-protected endpoints.
import { Schema, model, Document, Types } from "mongoose";

export type ContactEventType = "profile_view" | "call_click" | "whatsapp_click";

export interface IContactEvent extends Document {
  _id: Types.ObjectId;
  tutor: Types.ObjectId; // TutorProfile._id
  type: ContactEventType;
  actor?: Types.ObjectId; // User._id of whoever triggered it, when logged in
  createdAt: Date;
}

const contactEventSchema = new Schema<IContactEvent>(
  {
    tutor: { type: Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    type: { type: String, enum: ["profile_view", "call_click", "whatsapp_click"], required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

contactEventSchema.index({ tutor: 1, type: 1, createdAt: -1 });

export const ContactEvent = model<IContactEvent>("ContactEvent", contactEventSchema);
