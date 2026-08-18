import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Category } from "../models/category.model";
import { slugify } from "../utils/slugify";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json(new ApiResponse(200, categories));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const slug = slugify(req.body.name);
  const exists = await Category.findOne({ slug });
  if (exists) throw ApiError.conflict("A category with this name already exists");

  const category = await Category.create({ name: req.body.name, slug });
  res.status(201).json(new ApiResponse(201, category, "Category created"));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound("Category not found");
  res.status(200).json(new ApiResponse(200, null, "Category deleted"));
});
