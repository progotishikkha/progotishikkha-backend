import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Notification } from "../models/notification.model";

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const notifications = await Notification.find({ recipient: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.status(200).json(new ApiResponse(200, notifications));
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound("Notification not found");
  res.status(200).json(new ApiResponse(200, notification));
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
  res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  // Ownership check via the query itself (recipient: req.user.id) — this can
  // never delete another user's notification: if the id exists but belongs
  // to someone else, the filter simply matches nothing and we 404, exactly
  // like the existing markAsRead handler above.
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user.id,
  });
  if (!notification) throw ApiError.notFound("Notification not found");
  res.status(200).json(new ApiResponse(200, null, "Notification deleted"));
});
