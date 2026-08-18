import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as adminService from "../services/admin.service";

export const listStudents = asyncHandler(async (_req: Request, res: Response) => {
  const students = await adminService.listStudents();
  res.status(200).json(new ApiResponse(200, students));
});

export const listTutors = asyncHandler(async (_req: Request, res: Response) => {
  const tutors = await adminService.listTutors();
  res.status(200).json(new ApiResponse(200, tutors));
});

export const approveTutor = asyncHandler(async (req: Request, res: Response) => {
  const tutor = await adminService.approveTutor(req.params.id);
  res.status(200).json(new ApiResponse(200, tutor, "Tutor approved"));
});

export const toggleSuspendUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.toggleSuspendUser(req.params.id);
  res.status(200).json(new ApiResponse(200, user, "User status updated"));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteUser(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "User deleted"));
});

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await adminService.getAnalyticsSummary();
  res.status(200).json(new ApiResponse(200, summary));
});

export const broadcastNotification = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.broadcastNotification(req.body);
  res
    .status(200)
    .json(new ApiResponse(200, result, `Notification sent to ${result.recipientCount} user(s)`));
});
