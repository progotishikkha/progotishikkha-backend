import { Review } from "../models/review.model";
import { TuitionPost } from "../models/tuitionPost.model";
import { TutorProfile } from "../models/tutorProfile.model";
import { ApiError } from "../utils/ApiError";
import { getStudentProfileIdOrThrow } from "../utils/resolveProfile";
import { notify } from "./notification.service";
import { CreateReviewInput } from "../validators/review.validator";

const recalculateTutorRating = async (tutorId: string) => {
  const reviews = await Review.find({ tutor: tutorId });
  const reviewCount = reviews.length;
  const rating = reviewCount === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

  await TutorProfile.findByIdAndUpdate(tutorId, { rating, reviewCount });
};

export const createReview = async (userId: string, input: CreateReviewInput) => {
  const studentId = await getStudentProfileIdOrThrow(userId);

  const post = await TuitionPost.findById(input.tuitionPostId);
  if (!post) throw ApiError.notFound("Tuition post not found");
  if (post.student.toString() !== studentId.toString()) {
    throw ApiError.forbidden("You do not own this tuition post");
  }
  if (!post.hiredTutor) {
    throw ApiError.badRequest("You can only review a tutor after hiring them for this post");
  }

  const review = await Review.create({
    tutor: post.hiredTutor,
    student: studentId,
    tuitionPost: post._id,
    rating: input.rating,
    comment: input.comment,
  });

  await recalculateTutorRating(post.hiredTutor.toString());

  const tutorProfile = await TutorProfile.findById(post.hiredTutor);
  if (tutorProfile) {
    await notify({
      recipient: tutorProfile.user,
      type: "new_review",
      message: `You received a new ${input.rating}-star review.`,
      relatedId: review._id,
    });
  }

  return review;
};

export const listReviewsForTutor = async (tutorId: string) => {
  return Review.find({ tutor: tutorId })
    .populate({ path: "student", populate: { path: "user", select: "fullName" } })
    .sort({ createdAt: -1 });
};

export const listAllReviewsForAdmin = async () => {
  return Review.find()
    .populate({ path: "tutor", populate: { path: "user", select: "fullName" } })
    .populate({ path: "student", populate: { path: "user", select: "fullName" } })
    .sort({ createdAt: -1 });
};

export const deleteReview = async (id: string) => {
  const review = await Review.findById(id);
  if (!review) throw ApiError.notFound("Review not found");
  const tutorId = review.tutor.toString();
  await review.deleteOne();
  await recalculateTutorRating(tutorId);
};
