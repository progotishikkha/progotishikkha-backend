"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notify = void 0;
const notification_model_1 = require("../models/notification.model");
const sockets_1 = require("../sockets");
/**
 * Persists a notification and, if the recipient currently has a live
 * Socket.io connection (they joined their own room in sockets/index.ts),
 * pushes it to them instantly. Offline users simply see it on next login
 * via GET /notifications.
 */
const notify = async (input) => {
    const notification = await notification_model_1.Notification.create({
        recipient: input.recipient,
        type: input.type,
        message: input.message,
        link: input.link,
        relatedId: input.relatedId,
    });
    const io = (0, sockets_1.getIO)();
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
exports.notify = notify;
//# sourceMappingURL=notification.service.js.map