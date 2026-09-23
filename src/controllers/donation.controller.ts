import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as donationService from "../services/donation.service";

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const donations = await donationService.listMyDonations(req.user.id);
  res.status(200).json(new ApiResponse(200, donations));
});

export const instructions = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, donationService.getPaymentInstructions()));
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const donation = await donationService.getDonation(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, donation));
});

export const submitPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const donation = await donationService.submitPayment(req.user.id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, donation, "Payment submitted for verification"));
});
