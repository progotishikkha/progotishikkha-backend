"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTutorProfileIdOrThrow = exports.getStudentProfileIdOrThrow = void 0;
const studentProfile_model_1 = require("../models/studentProfile.model");
const tutorProfile_model_1 = require("../models/tutorProfile.model");
const ApiError_1 = require("../utils/ApiError");
const getStudentProfileIdOrThrow = async (userId) => {
    const profile = await studentProfile_model_1.StudentProfile.findOne({ user: userId }).select("_id");
    if (!profile)
        throw ApiError_1.ApiError.notFound("Student profile not found");
    return profile._id;
};
exports.getStudentProfileIdOrThrow = getStudentProfileIdOrThrow;
const getTutorProfileIdOrThrow = async (userId) => {
    const profile = await tutorProfile_model_1.TutorProfile.findOne({ user: userId }).select("_id");
    if (!profile)
        throw ApiError_1.ApiError.notFound("Tutor profile not found");
    return profile._id;
};
exports.getTutorProfileIdOrThrow = getTutorProfileIdOrThrow;
//# sourceMappingURL=resolveProfile.js.map