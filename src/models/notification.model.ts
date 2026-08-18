import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "new_application"
  | "tutor_hired"
  | "tutor_rejected"
  | "new_review"
  | "new_match"
  | "system";

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId; // User._id — Socket.io rooms are keyed by user id
  type: NotificationType;
  message: string;
  link?: string;
  isRead: boolean;
  relatedId?: Types.ObjectId;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["new_application", "tutor_hired", "tutor_rejected", "new_review", "new_match", "system"],
      required: true,
    },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    relatedId: { type: Schema.Types.ObjectId },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>("Notification", notificationSchema);
