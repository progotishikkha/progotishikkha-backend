import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as blogService from "../services/blog.service";
import { uploadBufferToCloudinary } from "../services/upload.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const blog = await blogService.createBlog(req.user.id, req.body);

  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, "blog");
    blog.featuredImage = result;
    await blog.save();
  }

  res.status(201).json(new ApiResponse(201, blog, "Blog post created"));
});

export const listPublished = asyncHandler(async (req: Request, res: Response) => {
  const { category, search, page = "1", limit = "9" } = req.query as Record<string, string>;
  const result = await blogService.listPublishedBlogs({
    category,
    search,
    page: Number(page),
    limit: Number(limit),
  });
  res.status(200).json(new ApiResponse(200, result.blogs));
});

export const listAllForAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const blogs = await blogService.listAllBlogsForAdmin();
  res.status(200).json(new ApiResponse(200, blogs));
});

export const getBySlug = asyncHandler(async (req: Request, res: Response) => {
  const blog = await blogService.getBlogBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, blog));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const blog = await blogService.updateBlog(req.params.id, req.body);

  if (req.file) {
    const result = await uploadBufferToCloudinary(req.file.buffer, "blog");
    blog.featuredImage = result;
    await blog.save();
  }

  res.status(200).json(new ApiResponse(200, blog, "Blog post updated"));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await blogService.deleteBlog(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Blog post deleted"));
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const comment = await blogService.addComment(req.params.slug, req.user.id, req.body.content);
  res.status(201).json(new ApiResponse(201, comment, "Comment added"));
});

export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const comments = await blogService.listComments(req.params.slug);
  res.status(200).json(new ApiResponse(200, comments));
});
