"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.listAllReviewsForAdmin = exports.listReviewsForTutor = exports.createReview = void 0;
const review_model_1 = require("../models/review.model");
const tuitionPost_model_1 = require("../models/tuitionPost.model");
const tutorProfile_model_1 = require("../models/tutorProfile.model");
const ApiError_1 = require("../utils/ApiError");
const resolveProfile_1 = require("../utils/resolveProfile");
const notification_service_1 = require("./notification.service");
const recalculateTutorRating = async (tutorId) => {
    const reviews = await review_model_1.Review.find({ tutor: tutorId });
    const reviewCount = reviews.length;
    const rating = reviewCount === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
    await tutorProfile_model_1.TutorProfile.findByIdAndUpdate(tutorId, { rating, reviewCount });
};
const createReview = async (userId, input) => {
    const studentId = await (0, resolveProfile_1.getStudentProfileIdOrThrow)(userId);
    const post = await tuitionPost_model_1.TuitionPost.findById(input.tuitionPostId);
    if (!post)
        throw ApiError_1.ApiError.notFound("Tuition post not found");
    if (post.student.toString() !== studentId.toString()) {
        throw ApiError_1.ApiError.forbidden("You do not own this tuition post");
    }
    if (!post.hiredTutor) {
        throw ApiError_1.ApiError.badRequest("You can only review a tutor after hiring them for this post");
    }
    const review = await review_model_1.Review.create({
        tutor: post.hiredTutor,
        student: studentId,
        tuitionPost: post._id,
        rating: input.rating,
        comment: input.comment,
    });
    await recalculateTutorRating(post.hiredTutor.toString());
    const tutorProfile = await tutorProfile_model_1.TutorProfile.findById(post.hiredTutor);
    if (tutorProfile) {
        await (0, notification_service_1.notify)({
            recipient: tutorProfile.user,
            type: "new_review",
            message: `You received a new ${input.rating}-star review.`,
            relatedId: review._id,
        });
    }
    return review;
};
exports.createReview = createReview;
const listReviewsForTutor = async (tutorId) => {
    return review_model_1.Review.find({ tutor: tutorId })
        .populate({ path: "student", populate: { path: "user", select: "fullName" } })
        .sort({ createdAt: -1 });
};
exports.listReviewsForTutor = listReviewsForTutor;
const listAllReviewsForAdmin = async () => {
    return review_model_1.Review.find()
        .populate({ path: "tutor", populate: { path: "user", select: "fullName" } })
        .populate({ path: "student", populate: { path: "user", select: "fullName" } })
        .sort({ createdAt: -1 });
};
exports.listAllReviewsForAdmin = listAllReviewsForAdmin;
const deleteReview = async (id) => {
    const review = await review_model_1.Review.findById(id);
    if (!review)
        throw ApiError_1.ApiError.notFound("Review not found");
    const tutorId = review.tutor.toString();
    await review.deleteOne();
    await recalculateTutorRating(tutorId);
};
exports.deleteReview = deleteReview;
//# sourceMappingURL=review.service.js.map