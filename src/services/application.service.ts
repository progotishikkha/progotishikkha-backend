import { Application } from "../models/application.model";
import { TuitionPost } from "../models/tuitionPost.model";
import { TutorProfile } from "../models/tutorProfile.model";
import { SavedTuition } from "../models/savedTuition.model";
import { StudentProfile } from "../models/studentProfile.model";
import { ApiError } from "../utils/ApiError";
import { getStudentProfileIdOrThrow, getTutorProfileIdOrThrow } from "../utils/resolveProfile";
import { notify } from "./notification.service";
import { ApplyToTuitionInput } from "../validators/application.validator";

export const applyToTuition = async (userId: string, input: ApplyToTuitionInput) => {
  const tutorId = await getTutorProfileIdOrThrow(userId);

  const tutorProfile = await TutorProfile.findById(tutorId);
  if (!tutorProfile?.isApproved) {
    throw ApiError.forbidden(
      "Complete your profile (qualification, university, department, location, about) to get approved and start applying"
    );
  }

  const post = await TuitionPost.findById(input.tuitionPostId);
  if (!post) throw ApiError.notFound("Tuition post not found");
  if (post.status !== "open") throw ApiError.badRequest("This tuition post is no longer accepting applications");

  const application = await Application.create({
    tuitionPost: post._id,
    tutor: tutorId,
    coverMessage: input.coverMessage,
    expectedSalary: input.expectedSalary,
    availability: input.availability,
  });

  // Notify the student who owns the post.
  const studentProfile = await StudentProfile.findById(post.student);
  if (studentProfile) {
    await notify({
      recipient: studentProfile.user,
      type: "new_application",
      message: `A tutor applied to your post: ${post.title}`,
      link: `/student/posts/${post._id}/applicants`,
      relatedId: application._id,
    });
  }

  return application;
};

export const listMyApplications = async (userId: string) => {
  const tutorId = await getTutorProfileIdOrThrow(userId);
  return Application.find({ tutor: tutorId })
    .populate("tuitionPost", "title salary location status")
    .sort({ createdAt: -1 });
};

export const listApplicationsForPost = async (postId: string, userId: string) => {
  const studentId = await getStudentProfileIdOrThrow(userId);
  const post = await TuitionPost.findById(postId);
  if (!post) throw ApiError.notFound("Tuition post not found");
  if (post.student.toString() !== studentId.toString()) {
    throw ApiError.forbidden("You do not own this tuition post");
  }

  return Application.find({ tuitionPost: postId })
    .populate({
      path: "tutor",
      populate: { path: "user", select: "fullName email phone" },
    })
    .sort({ createdAt: -1 });
};

const assertStudentOwnsApplicationPost = async (applicationId: string, userId: string) => {
  const studentId = await getStudentProfileIdOrThrow(userId);
  const application = await Application.findById(applicationId).populate("tuitionPost");
  if (!application) throw ApiError.notFound("Application not found");

  const post = await TuitionPost.findById(application.tuitionPost);
  if (!post || post.student.toString() !== studentId.toString()) {
    throw ApiError.forbidden("You do not own this tuition post");
  }
  return { application, post };
};

export const hireApplicant = async (applicationId: string, userId: string) => {
  const { application, post } = await assertStudentOwnsApplicationPost(applicationId, userId);

  application.status = "hired";
  await application.save();

  post.status = "filled";
  post.hiredTutor = application.tutor;
  await post.save();

  // Reject all other pending applications for this post.
  await Application.updateMany(
    { tuitionPost: post._id, _id: { $ne: application._id }, status: "pending" },
    { status: "rejected" }
  );

  const tutorProfile = await TutorProfile.findById(application.tutor);
  if (tutorProfile) {
    tutorProfile.completedTuitionCount += 1;
    await tutorProfile.save();

    await notify({
      recipient: tutorProfile.user,
      type: "tutor_hired",
      message: `You were hired for: ${post.title}`,
      link: "/tutor/applications",
      relatedId: post._id,
    });
  }

  return application;
};

export const rejectApplicant = async (applicationId: string, userId: string) => {
  const { application, post } = await assertStudentOwnsApplicationPost(applicationId, userId);

  application.status = "rejected";
  await application.save();

  const tutorProfile = await TutorProfile.findById(application.tutor);
  if (tutorProfile) {
    await notify({
      recipient: tutorProfile.user,
      type: "tutor_rejected",
      message: `Your application for "${post.title}" was not selected this time.`,
      relatedId: post._id,
    });
  }

  return application;
};

export const saveTuition = async (userId: string, tuitionPostId: string) => {
  const tutorId = await getTutorProfileIdOrThrow(userId);
  const post = await TuitionPost.findById(tuitionPostId);
  if (!post) throw ApiError.notFound("Tuition post not found");

  await SavedTuition.findOneAndUpdate(
    { tutor: tutorId, tuitionPost: tuitionPostId },
    { tutor: tutorId, tuitionPost: tuitionPostId },
    { upsert: true }
  );
};

export const unsaveTuition = async (userId: string, tuitionPostId: string) => {
  const tutorId = await getTutorProfileIdOrThrow(userId);
  await SavedTuition.deleteOne({ tutor: tutorId, tuitionPost: tuitionPostId });
};

export const listSavedTuitions = async (userId: string) => {
  const tutorId = await getTutorProfileIdOrThrow(userId);
  const saved = await SavedTuition.find({ tutor: tutorId }).populate("tuitionPost");
  return saved.map((s) => s.tuitionPost);
};
