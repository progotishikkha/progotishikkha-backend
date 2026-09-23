import { Types } from "mongoose";
import { StudentProfile } from "../models/studentProfile.model";
import { TutorProfile } from "../models/tutorProfile.model";
import { ApiError } from "../utils/ApiError";

export const getStudentProfileIdOrThrow = async (userId: string): Promise<Types.ObjectId> => {
  const profile = await StudentProfile.findOne({ user: userId }).select("_id");
  if (!profile) throw ApiError.notFound("Student profile not found");
  return profile._id;
};

export const getTutorProfileIdOrThrow = async (userId: string): Promise<Types.ObjectId> => {
  const profile = await TutorProfile.findOne({ user: userId }).select("_id");
  if (!profile) throw ApiError.notFound("Tutor profile not found");
  return profile._id;
};
