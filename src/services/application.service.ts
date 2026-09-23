import { Application } from "../models/application.model";
import { TuitionPost } from "../models/tuitionPost.model";
import { TutorProfile } from "../models/tutorProfile.model";
import { SavedTuition } from "../models/savedTuition.model";
import { Donation } from "../models/donation.model";
import { User } from "../models/user.model";
import { DONATION_PERCENTAGE, calculateDonationAmount } from "./donation.service";
import { StudentProfile } from "../models/studentProfile.model";
import { ApiError } from "../utils/ApiError";
import { getStudentProfileIdOrThrow, getTutorProfileIdOrThrow } from "../utils/resolveProfile";
import { notify } from "./notification.service";
import { logAction } from "./auditLog.service";
import { ApplyToTuitionInput } from "../validators/application.validator";

export const applyToTuition = async (userId: string, input: ApplyToTuitionInput) => {
  const tutorId = await getTutorProfileIdOrThrow(userId);

  const tutorProfile = await TutorProfile.findById(tutorId);
  if (!tutorProfile) {
    throw ApiError.notFound("Tutor profile not found");
  }
  // Tutors may apply before admin verification. Rejected profiles remain
  // blocked; verification can still be completed later by an admin.
  if (tutorProfile.verificationStatus === "rejected") {
    throw ApiError.forbidden(
      "Your tutor profile has been rejected. Please update your profile and contact admin before applying."
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
    connectionStatus: "not_connected",
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
      select: "-whatsappNumber -verificationNote -verifiedBy -verificationRequestedAt -verifiedAt",
      populate: { path: "user", select: "fullName" },
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

  // --- Race-condition guard (spec section 7) -----------------------------
  // Two simultaneous "Hire" clicks (on the same or different applicants for
  // the same post) must not both succeed. Rather than relying on the
  // documents already loaded above (which can be stale by the time we
  // write), we re-validate and transition each document atomically with a
  // conditional update: the write only applies if the condition still holds
  // at write time, and Mongo guarantees a single document write is atomic.
  // This gives the required guarantee without needing a multi-document
  // transaction, which would require the target MongoDB deployment to run
  // as a replica set (true for Atlas, not guaranteed for a bare standalone
  // instance) — see spec section 27.
  const tutorProfileCheck = await TutorProfile.findById(application.tutor).select("isApproved verificationStatus");
  if (!tutorProfileCheck || tutorProfileCheck.verificationStatus === "rejected") {
    throw ApiError.badRequest("This tutor is no longer eligible to be hired");
  }

  const claimedPost = await TuitionPost.findOneAndUpdate(
    { _id: post._id, status: "open" },
    { status: "filled", hiredTutor: application.tutor },
    { new: true }
  );
  if (!claimedPost) {
    throw ApiError.conflict("This tuition post already has a hired tutor");
  }

  const claimedApplication = await Application.findOneAndUpdate(
    { _id: application._id, status: "pending" },
    { status: "hired", connectionStatus: "pending_admin" },
    { new: true }
  );
  if (!claimedApplication) {
    // Compensate: the post claim above succeeded but this specific
    // application had already moved out of "pending" (e.g. rejected or
    // hired concurrently by another request) — release the post back to
    // "open" so it isn't stuck "filled" with no hired application.
    await TuitionPost.findOneAndUpdate(
      { _id: post._id, status: "filled", hiredTutor: application.tutor },
      { status: "open", $unset: { hiredTutor: "" } }
    );
    throw ApiError.conflict("This application can no longer be hired");
  }

  // Keep the existing hire flow intact while creating the first-month donation
  // record. Donation amount is calculated server-side and locked to the
  // platform's fixed percentage — never trusted from client input.
  await Donation.findOneAndUpdate(
    { application: claimedApplication._id },
    {
      application: claimedApplication._id,
      tutor: claimedApplication.tutor,
      tuitionPost: claimedPost._id,
      firstMonthSalary: claimedPost.salary,
      percentage: DONATION_PERCENTAGE,
      donationAmount: calculateDonationAmount(claimedPost.salary),
      status: "not_due",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Reject all other pending applications for this post.
  await Application.updateMany(
    { tuitionPost: claimedPost._id, _id: { $ne: claimedApplication._id }, status: "pending" },
    { status: "rejected" }
  );

  // NOTE: completedTuitionCount intentionally is NOT incremented here.
  // Being hired is not the same as completing a tuition (spec section 21).
  // It is incremented once the admin confirms the first month's salary was
  // actually received — see admin.service.markDonationSalaryReceived.
  const tutorProfile = await TutorProfile.findById(claimedApplication.tutor);
  if (tutorProfile) {
    await notify({
      recipient: tutorProfile.user,
      type: "tutor_hired",
      message: `You were hired for: ${claimedPost.title}`,
      link: "/tutor/applications",
      relatedId: claimedPost._id,
    });
  }

  // Notify every admin that a hire happened and needs mediation (spec
  // section 8). Private contact info is never included in the notification
  // payload — only enough context for the admin to find the request.
  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      notify({
        recipient: admin._id,
        type: "hire_request",
        message: `A student hired a tutor for "${claimedPost.title}". Awaiting admin mediation.`,
        link: `/admin/posts`,
        relatedId: claimedApplication._id,
      })
    )
  );

  await logAction({
    actor: userId,
    action: "APPLICATION_HIRED",
    targetType: "Application",
    targetId: claimedApplication._id,
    metadata: { tuitionPost: claimedPost._id, tutor: claimedApplication.tutor },
  });

  return claimedApplication;
};

export const rejectApplicant = async (applicationId: string, userId: string) => {
  const { application, post } = await assertStudentOwnsApplicationPost(applicationId, userId);

  // Only a still-pending application can be rejected — an already
  // hired/rejected application shouldn't silently change state again.
  const updated = await Application.findOneAndUpdate(
    { _id: application._id, status: "pending" },
    { status: "rejected" },
    { new: true }
  );
  if (!updated) {
    throw ApiError.conflict("This application has already been decided");
  }

  const tutorProfile = await TutorProfile.findById(updated.tutor);
  if (tutorProfile) {
    await notify({
      recipient: tutorProfile.user,
      type: "tutor_rejected",
      message: `Your application for "${post.title}" was not selected this time.`,
      relatedId: post._id,
    });
  }

  await logAction({
    actor: userId,
    action: "APPLICATION_REJECTED",
    targetType: "Application",
    targetId: updated._id,
    metadata: { tuitionPost: post._id },
  });

  return updated;
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
