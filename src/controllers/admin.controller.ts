import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as adminService from "../services/admin.service";
import { listAuditLogs } from "../services/auditLog.service";

export const listStudents = asyncHandler(async (_req: Request, res: Response) => {
  const students = await adminService.listStudents();
  res.status(200).json(new ApiResponse(200, students));
});

export const listTutors = asyncHandler(async (_req: Request, res: Response) => {
  const tutors = await adminService.listTutors();
  res.status(200).json(new ApiResponse(200, tutors));
});

export const verifyTutor = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const status = req.body.status ?? "verified";
  const tutor = await adminService.verifyTutor(req.params.id, req.user.id, status, req.body.note);
  res.status(200).json(new ApiResponse(200, tutor, `Tutor ${status}`));
});

export const verifyStudent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const student = await adminService.verifyStudent(req.params.id, req.user.id, req.body.status, req.body.note);
  res.status(200).json(new ApiResponse(200, student, `Student ${req.body.status}`));
});

export const getUserContact = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const contact = await adminService.getUserContact(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, contact));
});

export const listTuitionPosts = asyncHandler(async (_req: Request, res: Response) => {
  const posts = await adminService.listTuitionPosts();
  res.status(200).json(new ApiResponse(200, posts));
});

export const getTuitionPostDetail = asyncHandler(async (req: Request, res: Response) => {
  const detail = await adminService.getTuitionPostDetail(req.params.id);
  res.status(200).json(new ApiResponse(200, detail));
});

export const deleteTuitionPost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await adminService.deleteTuitionPost(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, null, "Tuition post deleted"));
});

// --- Admin mediation / connection state machine (spec section 9) ---------

export const startApplicationContact = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const application = await adminService.startApplicationContact(req.params.id, req.user.id, req.body.notes);
  res.status(200).json(new ApiResponse(200, application, "Contact started"));
});

export const markApplicationConnected = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const application = await adminService.markApplicationConnected(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, application, "Student and tutor marked as connected"));
});

export const markApplicationConnectionFailed = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const application = await adminService.markApplicationConnectionFailed(req.params.id, req.user.id, req.body.failureReason);
  res.status(200).json(new ApiResponse(200, application, "Connection marked as failed"));
});

export const cancelApplicationConnection = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const application = await adminService.cancelApplicationConnection(req.params.id, req.user.id, req.body.reason);
  res.status(200).json(new ApiResponse(200, application, "Hire cancelled; tuition post reopened"));
});

// --- Users -----------------------------------------------------------------

export const toggleSuspendUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await adminService.toggleSuspendUser(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, user, "User status updated"));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await adminService.deleteUser(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, null, "User deleted"));
});

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await adminService.getAnalyticsSummary();
  res.status(200).json(new ApiResponse(200, summary));
});

// --- Donations ---------------------------------------------------------

export const listDonations = asyncHandler(async (req: Request, res: Response) => {
  const donations = await adminService.listDonations(req.query.status as string | undefined);
  res.status(200).json(new ApiResponse(200, donations));
});

export const markDonationSalaryReceived = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const donation = await adminService.markDonationSalaryReceived(req.params.id, req.user.id, req.body.dueDate);
  res.status(200).json(new ApiResponse(200, donation, "Donation is now due"));
});

export const verifyDonationPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const donation = await adminService.verifyDonationPayment(req.params.id, req.user.id, req.body.approved, req.body.note);
  res.status(200).json(new ApiResponse(200, donation, req.body.approved ? "Donation payment verified" : "Donation payment rejected"));
});

export const markDonationOverdue = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const donation = await adminService.markDonationOverdue(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, donation, "Donation marked overdue"));
});

export const remindDonation = asyncHandler(async (req: Request, res: Response) => {
  const donation = await adminService.remindDonation(req.params.id);
  res.status(200).json(new ApiResponse(200, donation, "Reminder sent"));
});

export const suspendDonationTutor = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const donation = await adminService.suspendDonationTutor(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, donation, "Tutor suspended"));
});

export const reinstateTutor = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const donation = await adminService.reinstateTutor(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, donation, "Tutor reinstated"));
});

export const broadcastNotification = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.broadcastNotification(req.body);
  res.status(200).json(new ApiResponse(200, result, `Notification sent to ${result.recipientCount} user(s)`));
});

// --- Audit log (spec section 23) -------------------------------------------

export const listAudit = asyncHandler(async (req: Request, res: Response) => {
  const logs = await listAuditLogs({
    targetType: req.query.targetType as string | undefined,
    targetId: req.query.targetId as string | undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.status(200).json(new ApiResponse(200, logs));
});
