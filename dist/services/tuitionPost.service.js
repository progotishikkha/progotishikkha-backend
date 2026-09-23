"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTuitionPost = exports.updateTuitionPost = exports.getTuitionPostById = exports.listLiveTuitionPosts = exports.listMyTuitionPosts = exports.createTuitionPost = void 0;
const tuitionPost_model_1 = require("../models/tuitionPost.model");
const application_model_1 = require("../models/application.model");
const donation_model_1 = require("../models/donation.model");
const ApiError_1 = require("../utils/ApiError");
const resolveProfile_1 = require("../utils/resolveProfile");
const studentProfile_model_1 = require("../models/studentProfile.model");
const matchingService_1 = require("./matchingService");
const createTuitionPost = async (userId, input) => {
    const studentId = await (0, resolveProfile_1.getStudentProfileIdOrThrow)(userId);
    const studentProfile = await studentProfile_model_1.StudentProfile.findById(studentId);
    if (!studentProfile)
        throw ApiError_1.ApiError.notFound("Student profile not found");
    // Students may publish tuition requests before admin verification.
    // Rejected profiles remain blocked so an explicit admin rejection cannot
    // be bypassed by creating another post.
    if (studentProfile.verificationStatus === "rejected") {
        throw ApiError_1.ApiError.forbidden("Your student profile has been rejected. Please update your profile and contact admin before posting tuition requests.");
    }
    const post = await tuitionPost_model_1.TuitionPost.create({ ...input, student: studentId });
    // Fire-and-forget: matching/notifying tutors must never block or fail the
    // student's "post created" response. Any error here is logged, not thrown.
    (0, matchingService_1.matchTutorsForPost)(post).catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`Tutor matching failed for post ${post._id}:`, err instanceof Error ? err.message : err);
    });
    return post;
};
exports.createTuitionPost = createTuitionPost;
const listMyTuitionPosts = async (userId) => {
    const studentId = await (0, resolveProfile_1.getStudentProfileIdOrThrow)(userId);
    return tuitionPost_model_1.TuitionPost.find({ student: studentId }).sort({ createdAt: -1 });
};
exports.listMyTuitionPosts = listMyTuitionPosts;
const listLiveTuitionPosts = async (filters) => {
    const query = { status: "open" };
    if (filters.subject)
        query.subject = new RegExp(filters.subject, "i");
    if (filters.location)
        query.location = new RegExp(filters.location, "i");
    if (filters.medium)
        query.medium = new RegExp(filters.medium, "i");
    if (filters.class)
        query.class = new RegExp(filters.class, "i");
    if (filters.minSalary || filters.maxSalary) {
        query.salary = {};
        if (filters.minSalary)
            query.salary.$gte = filters.minSalary;
        if (filters.maxSalary)
            query.salary.$lte = filters.maxSalary;
    }
    const skip = (filters.page - 1) * filters.limit;
    const [posts, total] = await Promise.all([
        tuitionPost_model_1.TuitionPost.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit),
        tuitionPost_model_1.TuitionPost.countDocuments(query),
    ]);
    return { posts, total, page: filters.page, limit: filters.limit };
};
exports.listLiveTuitionPosts = listLiveTuitionPosts;
const getTuitionPostById = async (id) => {
    const post = await tuitionPost_model_1.TuitionPost.findById(id);
    if (!post)
        throw ApiError_1.ApiError.notFound("Tuition post not found");
    return post;
};
exports.getTuitionPostById = getTuitionPostById;
const assertOwnership = async (postId, userId) => {
    const studentId = await (0, resolveProfile_1.getStudentProfileIdOrThrow)(userId);
    const post = await tuitionPost_model_1.TuitionPost.findById(postId);
    if (!post)
        throw ApiError_1.ApiError.notFound("Tuition post not found");
    if (post.student.toString() !== studentId.toString()) {
        throw ApiError_1.ApiError.forbidden("You do not own this tuition post");
    }
    return post;
};
const updateTuitionPost = async (postId, userId, input) => {
    const post = await assertOwnership(postId, userId);
    Object.assign(post, input);
    await post.save();
    return post;
};
exports.updateTuitionPost = updateTuitionPost;
const deleteTuitionPost = async (postId, userId) => {
    const post = await assertOwnership(postId, userId);
    await application_model_1.Application.deleteMany({ tuitionPost: post._id });
    await donation_model_1.Donation.deleteMany({ tuitionPost: post._id });
    await post.deleteOne();
};
exports.deleteTuitionPost = deleteTuitionPost;
//# sourceMappingURL=tuitionPost.service.js.map