import { Request, Response } from "express";
import { HydratedDocument, FilterQuery } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { TutorProfile, ITutorProfile } from "../models/tutorProfile.model";
import { StudentProfile } from "../models/studentProfile.model";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../services/upload.service";
import * as authService from "../services/auth.service";
import { TutorFiltersInput } from "../validators/profile.validator";
import { getTutorProfileIdOrThrow } from "../utils/resolveProfile";

// Public marketplace listing — GET /tutors. Only ever surfaces approved
// profiles; an unapproved/incomplete tutor is not yet ready to be publicly
// discoverable or contacted.
export const listTutors = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as TutorFiltersInput;
  const query: FilterQuery<ITutorProfile> = { isApproved: true };

  if (filters.subject) query.subjects = new RegExp(filters.subject, "i");
  if (filters.location) query.location = new RegExp(filters.location, "i");
  if (filters.availability) query.availability = filters.availability;

  // `q` is a loose search across subjects/location; matching by tutor name
  // requires a $lookup into `users` since fullName lives there, not on
  // TutorProfile, so it's handled via aggregation below when present.
  const skip = (filters.page - 1) * filters.limit;

  if (filters.q) {
    const searchRegex = new RegExp(filters.q, "i");
    const pipeline = [
      { $match: query },
      {
        $lookup: { from: "users", localField: "user", foreignField: "_id", as: "userDoc" },
      },
      { $unwind: "$userDoc" },
      {
        $project: { whatsappNumber: 0, verificationNote: 0, verifiedBy: 0, verificationRequestedAt: 0, verifiedAt: 0, "userDoc.email": 0, "userDoc.phone": 0 },
      },
      {
        $match: {
          $or: [
            { "userDoc.fullName": searchRegex },
            { subjects: searchRegex },
            { location: searchRegex },
          ],
        },
      },
      { $sort: { rating: -1 as const, createdAt: -1 as const } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: filters.limit }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await TutorProfile.aggregate(pipeline);
    const tutors = (result?.data ?? []).map((t: Record<string, unknown> & { userDoc: { _id: unknown; fullName: string; email: string; phone: string } }) => ({
      ...t,
      user: { id: String(t.userDoc?._id ?? ""), fullName: t.userDoc?.fullName },
      userDoc: undefined,
    }));
    const total = result?.total?.[0]?.count ?? 0;

    res
      .status(200)
      .json(new ApiResponse(200, { tutors, total, page: filters.page, limit: filters.limit }));
    return;
  }

  const [tutors, total] = await Promise.all([
    TutorProfile.find(query)
      .select("-whatsappNumber -verificationNote -verifiedBy -verificationRequestedAt -verifiedAt")
      .populate("user", "fullName")
      .sort({ rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(filters.limit),
    TutorProfile.countDocuments(query),
  ]);

  res.status(200).json(new ApiResponse(200, { tutors, total, page: filters.page, limit: filters.limit }));
});

export const getTutorById = asyncHandler(async (req: Request, res: Response) => {
  // Public tutor profiles intentionally exclude contact information. Contact
  // details are only exposed through admin-protected endpoints.
  //
  // isApproved: true is required here too, not just on the list endpoint —
  // otherwise an unapproved/rejected/suspended tutor's profile is still
  // reachable by anyone who guesses/enumerates the id directly, even though
  // they never show up in search (spec section 5).
  const profile = await TutorProfile.findOne({ _id: req.params.id, isApproved: true })
    .select("-whatsappNumber -verificationNote -verifiedBy -verificationRequestedAt -verifiedAt")
    .populate("user", "fullName");
  if (!profile) throw ApiError.notFound("Tutor not found");
  res.status(200).json(new ApiResponse(200, profile));
});

export const updateMyTutorProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  // fullName/phone live on the User document, not TutorProfile — split them
  // out so a phone-number change actually persists instead of being dropped
  // (Mongoose silently ignores unknown fields on a strict schema, which is
  // exactly why "phone cannot be changed" was happening before).
  const { fullName, phone, ...profileFields } = req.body;
  if (fullName || phone) {
    await authService.updateContactInfo(req.user.id, { fullName, phone });
  }

  let profile = await TutorProfile.findOneAndUpdate(
    { user: req.user.id },
    { $set: profileFields },
    { new: true, runValidators: true }
  );
  if (!profile) throw ApiError.notFound("Tutor profile not found");

  const me = await authService.getCurrentUserProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, me, "Profile updated"));
});

export const uploadMyTutorPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!req.file) throw ApiError.badRequest("No photo uploaded");

  // req.user.id comes only from a verified JWT (see auth.middleware) — there
  // is no way to pass a different user's id in, so this route can only ever
  // touch the caller's own TutorProfile document.
  const profile = await TutorProfile.findOne({ user: req.user.id });
  if (!profile) throw ApiError.notFound("Tutor profile not found");

  if (profile.profilePhoto?.publicId) {
    await deleteFromCloudinary(profile.profilePhoto.publicId).catch(() => undefined);
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, "profiles");
  profile.profilePhoto = result;
  await profile.save();

  res.status(200).json(new ApiResponse(200, profile, "Profile photo updated"));
});

export const updateMyStudentProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  const { fullName, phone, ...profileFields } = req.body;
  if (fullName || phone) {
    await authService.updateContactInfo(req.user.id, { fullName, phone });
  }

  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user.id },
    { $set: profileFields },
    { new: true, runValidators: true }
  );
  if (!profile) throw ApiError.notFound("Student profile not found");

  const me = await authService.getCurrentUserProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, me, "Profile updated"));
});

// Previously missing entirely — students had no way to upload/change a
// profile photo at all (only the tutor route existed). Mirrors
// uploadMyTutorPhoto: same ownership guarantee (req.user.id from the
// verified JWT), same Cloudinary flow, same old-photo cleanup.
export const uploadMyStudentPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!req.file) throw ApiError.badRequest("No photo uploaded");

  const profile = await StudentProfile.findOne({ user: req.user.id });
  if (!profile) throw ApiError.notFound("Student profile not found");

  if (profile.profilePhoto?.publicId) {
    await deleteFromCloudinary(profile.profilePhoto.publicId).catch(() => undefined);
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, "profiles");
  profile.profilePhoto = result;
  await profile.save();

  res.status(200).json(new ApiResponse(200, profile, "Profile photo updated"));
});
