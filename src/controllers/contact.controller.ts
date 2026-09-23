import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { ContactMessage } from "../models/contactMessage.model";

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const message = await ContactMessage.create(req.body);
  res.status(201).json(new ApiResponse(201, message, "Message sent — we'll get back to you soon."));
});

export const listAll = asyncHandler(async (_req: Request, res: Response) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, messages));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!message) throw ApiError.notFound("Message not found");
  res.status(200).json(new ApiResponse(200, message, "Status updated"));
});
