"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMyStudentPhoto = exports.updateMyStudentProfile = exports.uploadMyTutorPhoto = exports.updateMyTutorProfile = exports.getTutorById = exports.listTutors = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const tutorProfile_model_1 = require("../models/tutorProfile.model");
const studentProfile_model_1 = require("../models/studentProfile.model");
const upload_service_1 = require("../services/upload.service");
const authService = __importStar(require("../services/auth.service"));
// Public marketplace listing — GET /tutors. Only ever surfaces approved
// profiles; an unapproved/incomplete tutor is not yet ready to be publicly
// discoverable or contacted.
exports.listTutors = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const query = { isApproved: true };
    if (filters.subject)
        query.subjects = new RegExp(filters.subject, "i");
    if (filters.location)
        query.location = new RegExp(filters.location, "i");
    if (filters.availability)
        query.availability = filters.availability;
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
            { $sort: { rating: -1, createdAt: -1 } },
            {
                $facet: {
                    data: [{ $skip: skip }, { $limit: filters.limit }],
                    total: [{ $count: "count" }],
                },
            },
        ];
        const [result] = await tutorProfile_model_1.TutorProfile.aggregate(pipeline);
        const tutors = (result?.data ?? []).map((t) => ({
            ...t,
            user: { id: String(t.userDoc?._id ?? ""), fullName: t.userDoc?.fullName },
            userDoc: undefined,
        }));
        const total = result?.total?.[0]?.count ?? 0;
        res
            .status(200)
            .json(new ApiResponse_1.ApiResponse(200, { tutors, total, page: filters.page, limit: filters.limit }));
        return;
    }
    const [tutors, total] = await Promise.all([
        tutorProfile_model_1.TutorProfile.find(query)
            .select("-whatsappNumber -verificationNote -verifiedBy -verificationRequestedAt -verifiedAt")
            .populate("user", "fullName")
            .sort({ rating: -1, createdAt: -1 })
            .skip(skip)
            .limit(filters.limit),
        tutorProfile_model_1.TutorProfile.countDocuments(query),
    ]);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, { tutors, total, page: filters.page, limit: filters.limit }));
});
exports.getTutorById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Public tutor profiles intentionally exclude contact information. Contact
    // details are only exposed through admin-protected endpoints.
    //
    // isApproved: true is required here too, not just on the list endpoint —
    // otherwise an unapproved/rejected/suspended tutor's profile is still
    // reachable by anyone who guesses/enumerates the id directly, even though
    // they never show up in search (spec section 5).
    const profile = await tutorProfile_model_1.TutorProfile.findOne({ _id: req.params.id, isApproved: true })
        .select("-whatsappNumber -verificationNote -verifiedBy -verificationRequestedAt -verifiedAt")
        .populate("user", "fullName");
    if (!profile)
        throw ApiError_1.ApiError.notFound("Tutor not found");
    res.status(200).json(new ApiResponse_1.ApiResponse(200, profile));
});
exports.updateMyTutorProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    // fullName/phone live on the User document, not TutorProfile — split them
    // out so a phone-number change actually persists instead of being dropped
    // (Mongoose silently ignores unknown fields on a strict schema, which is
    // exactly why "phone cannot be changed" was happening before).
    const { fullName, phone, ...profileFields } = req.body;
    if (fullName || phone) {
        await authService.updateContactInfo(req.user.id, { fullName, phone });
    }
    let profile = await tutorProfile_model_1.TutorProfile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true, runValidators: true });
    if (!profile)
        throw ApiError_1.ApiError.notFound("Tutor profile not found");
    const me = await authService.getCurrentUserProfile(req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, me, "Profile updated"));
});
exports.uploadMyTutorPhoto = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    if (!req.file)
        throw ApiError_1.ApiError.badRequest("No photo uploaded");
    // req.user.id comes only from a verified JWT (see auth.middleware) — there
    // is no way to pass a different user's id in, so this route can only ever
    // touch the caller's own TutorProfile document.
    const profile = await tutorProfile_model_1.TutorProfile.findOne({ user: req.user.id });
    if (!profile)
        throw ApiError_1.ApiError.notFound("Tutor profile not found");
    if (profile.profilePhoto?.publicId) {
        await (0, upload_service_1.deleteFromCloudinary)(profile.profilePhoto.publicId).catch(() => undefined);
    }
    const result = await (0, upload_service_1.uploadBufferToCloudinary)(req.file.buffer, "profiles");
    profile.profilePhoto = result;
    await profile.save();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, profile, "Profile photo updated"));
});
exports.updateMyStudentProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const { fullName, phone, ...profileFields } = req.body;
    if (fullName || phone) {
        await authService.updateContactInfo(req.user.id, { fullName, phone });
    }
    const profile = await studentProfile_model_1.StudentProfile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true, runValidators: true });
    if (!profile)
        throw ApiError_1.ApiError.notFound("Student profile not found");
    const me = await authService.getCurrentUserProfile(req.user.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, me, "Profile updated"));
});
// Previously missing entirely — students had no way to upload/change a
// profile photo at all (only the tutor route existed). Mirrors
// uploadMyTutorPhoto: same ownership guarantee (req.user.id from the
// verified JWT), same Cloudinary flow, same old-photo cleanup.
exports.uploadMyStudentPhoto = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    if (!req.file)
        throw ApiError_1.ApiError.badRequest("No photo uploaded");
    const profile = await studentProfile_model_1.StudentProfile.findOne({ user: req.user.id });
    if (!profile)
        throw ApiError_1.ApiError.notFound("Student profile not found");
    if (profile.profilePhoto?.publicId) {
        await (0, upload_service_1.deleteFromCloudinary)(profile.profilePhoto.publicId).catch(() => undefined);
    }
    const result = await (0, upload_service_1.uploadBufferToCloudinary)(req.file.buffer, "profiles");
    profile.profilePhoto = result;
    await profile.save();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, profile, "Profile photo updated"));
});
//# sourceMappingURL=profile.controller.js.map