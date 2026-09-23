import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as reviewService from "../services/review.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const review = await reviewService.createReview(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, review, "Review submitted"));
});

export const listForTutor = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await reviewService.listReviewsForTutor(req.params.tutorId);
  res.status(200).json(new ApiResponse(200, reviews));
});

export const listAllForAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const reviews = await reviewService.listAllReviewsForAdmin();
  res.status(200).json(new ApiResponse(200, reviews));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await reviewService.deleteReview(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Review deleted"));
});
