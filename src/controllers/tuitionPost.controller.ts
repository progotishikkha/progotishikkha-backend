import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as tuitionPostService from "../services/tuitionPost.service";
import { TuitionFiltersInput } from "../validators/tuitionPost.validator";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const post = await tuitionPostService.createTuitionPost(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, post, "Tuition post created"));
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const posts = await tuitionPostService.listMyTuitionPosts(req.user.id);
  res.status(200).json(new ApiResponse(200, posts));
});

export const listLive = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as TuitionFiltersInput;
  const result = await tuitionPostService.listLiveTuitionPosts(filters);
  res.status(200).json(new ApiResponse(200, result.posts, undefined));
  void result.total; // pagination metadata available via result.total/page/limit if the client needs it
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const post = await tuitionPostService.getTuitionPostById(req.params.id);
  res.status(200).json(new ApiResponse(200, post));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const post = await tuitionPostService.updateTuitionPost(req.params.id, req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, post, "Tuition post updated"));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await tuitionPostService.deleteTuitionPost(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, null, "Tuition post deleted"));
});
