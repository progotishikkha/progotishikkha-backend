import { Types } from "mongoose";
import { Notification, NotificationType } from "../models/notification.model";
import { getIO } from "../sockets";

interface NotifyInput {
  recipient: Types.ObjectId | string;
  type: NotificationType;
  message: string;
  link?: string;
  relatedId?: Types.ObjectId | string;
}

/**
 * Persists a notification and, if the recipient currently has a live
 * Socket.io connection (they joined their own room in sockets/index.ts),
 * pushes it to them instantly. Offline users simply see it on next login
 * via GET /notifications.
 */
export const notify = async (input: NotifyInput): Promise<void> => {
  const notification = await Notification.create({
    recipient: input.recipient,
    type: input.type,
    message: input.message,
    link: input.link,
    relatedId: input.relatedId,
  });

  const io = getIO();
  if (io) {
    io.to(input.recipient.toString()).emit("notification", {
      id: notification._id,
      type: notification.type,
      message: notification.message,
      link: notification.link,
      isRead: false,
      createdAt: notification.createdAt,
    });
  }
};
