import { User } from "../models/user.model";
import { StudentProfile } from "../models/studentProfile.model";
import { TutorProfile } from "../models/tutorProfile.model";
import { TuitionPost } from "../models/tuitionPost.model";
import { Application } from "../models/application.model";
import { ApiError } from "../utils/ApiError";
import { notify } from "./notification.service";
import { BroadcastNotificationInput } from "../validators/admin.validator";

export const listStudents = async () => {
  const profiles = await StudentProfile.find().populate("user", "fullName email phone isSuspended createdAt");
  const postsCounts = await TuitionPost.aggregate([
    { $group: { _id: "$student", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(postsCounts.map((p) => [p._id.toString(), p.count]));

  return profiles.map((profile) => ({
    id: profile._id,
    user: profile.user,
    postsCount: countMap.get(profile._id.toString()) ?? 0,
  }));
};

export const listTutors = async () => {
  return TutorProfile.find().populate("user", "fullName email phone isSuspended createdAt");
};

export const approveTutor = async (tutorProfileId: string) => {
  const profile = await TutorProfile.findByIdAndUpdate(
    tutorProfileId,
    { isApproved: true },
    { new: true }
  );
  if (!profile) throw ApiError.notFound("Tutor not found");
  return profile;
};

export const toggleSuspendUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  user.isSuspended = !user.isSuspended;
  if (user.isSuspended) user.refreshSessions = []; // force logout everywhere
  await user.save();
  return user;
};

export const deleteUser = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  if (user.role === "student") {
    const profile = await StudentProfile.findOne({ user: user._id });
    if (profile) {
      const posts = await TuitionPost.find({ student: profile._id }).select("_id");
      await Application.deleteMany({ tuitionPost: { $in: posts.map((p) => p._id) } });
      await TuitionPost.deleteMany({ student: profile._id });
      await profile.deleteOne();
    }
  } else if (user.role === "tutor") {
    const profile = await TutorProfile.findOne({ user: user._id });
    if (profile) {
      await Application.deleteMany({ tutor: profile._id });
      await profile.deleteOne();
    }
  }

  await user.deleteOne();
};

export const getAnalyticsSummary = async () => {
  const [studentCount, tutorCount, openPostsCount, filledPostsCount, pendingApprovals] =
    await Promise.all([
      StudentProfile.countDocuments(),
      TutorProfile.countDocuments(),
      TuitionPost.countDocuments({ status: "open" }),
      TuitionPost.countDocuments({ status: "filled" }),
      TutorProfile.countDocuments({ isApproved: false }),
    ]);

  return { studentCount, tutorCount, openPostsCount, filledPostsCount, pendingApprovals };
};

/**
 * Sends a platform-wide notification to every user matching `audience`.
 * Reuses `notify()` (same persist-then-push-if-online path used for
 * application/review events) per recipient, so online users get it
 * instantly via Socket.io and offline users see it on next login through
 * GET /notifications — no separate delivery mechanism needed.
 */
export const broadcastNotification = async (input: BroadcastNotificationInput): Promise<{ recipientCount: number }> => {
  const roleFilter = input.audience === "all" ? {} : { role: input.audience === "students" ? "student" : "tutor" };
  const recipients = await User.find({ ...roleFilter, isVerified: true }).select("_id");

  await Promise.all(
    recipients.map((recipient) =>
      notify({
        recipient: recipient._id,
        type: "system",
        message: input.message,
      })
    )
  );

  return { recipientCount: recipients.length };
};
