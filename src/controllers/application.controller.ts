import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as applicationService from "../services/application.service";

export const apply = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const application = await applicationService.applyToTuition(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, application, "Application submitted"));
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const applications = await applicationService.listMyApplications(req.user.id);
  res.status(200).json(new ApiResponse(200, applications));
});

export const listForPost = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const applications = await applicationService.listApplicationsForPost(req.params.postId, req.user.id);
  res.status(200).json(new ApiResponse(200, applications));
});

export const hire = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const application = await applicationService.hireApplicant(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, application, "Tutor hired"));
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const application = await applicationService.rejectApplicant(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, application, "Applicant rejected"));
});

export const save = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await applicationService.saveTuition(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Tuition saved"));
});

export const unsave = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await applicationService.unsaveTuition(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Tuition removed from saved"));
});

export const listSaved = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const saved = await applicationService.listSavedTuitions(req.user.id);
  res.status(200).json(new ApiResponse(200, saved));
});
