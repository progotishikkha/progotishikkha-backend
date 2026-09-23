import { User } from "../models/user.model";
import { StudentProfile } from "../models/studentProfile.model";
import { TutorProfile } from "../models/tutorProfile.model";
import { TuitionPost } from "../models/tuitionPost.model";
import { Application } from "../models/application.model";
import { Donation } from "../models/donation.model";
import { ApiError } from "../utils/ApiError";
import { notify } from "./notification.service";
import { logAction } from "./auditLog.service";
import { BroadcastNotificationInput } from "../validators/admin.validator";
import { env } from "../config/env";

export const listStudents = async () => {
  // Read from User first so the admin UI still works even if a legacy account
  // is missing its role-specific profile document.
  const users = await User.find({ role: "student" })
    .select("fullName email phone isSuspended createdAt role")
    .sort({ createdAt: -1 });

  const userIds = users.map((u) => u._id);
  const profiles = await StudentProfile.find({ user: { $in: userIds } });
  const profileByUser = new Map(profiles.map((p) => [String(p.user), p]));

  const postsCounts = await TuitionPost.aggregate([
    { $match: { student: { $in: profiles.map((p) => p._id) } } },
    { $group: { _id: "$student", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(postsCounts.map((p) => [p._id.toString(), p.count]));

  return users.map((user) => {
    const profile = profileByUser.get(String(user._id));
    return {
      id: profile?._id ?? user._id,
      user,
      whatsappNumber: profile?.whatsappNumber,
      profilePhoto: profile?.profilePhoto,
      verificationStatus: profile?.verificationStatus ?? "pending",
      postsCount: profile ? (countMap.get(profile._id.toString()) ?? 0) : 0,
    };
  });
};

export const listTutors = async () => {
  const users = await User.find({ role: "tutor" })
    .select("fullName email phone isSuspended createdAt role")
    .sort({ createdAt: -1 });

  const userIds = users.map((u) => u._id);
  const profiles = await TutorProfile.find({ user: { $in: userIds } });
  const profileByUser = new Map(profiles.map((p) => [String(p.user), p]));

  return users.map((user) => {
    const profile = profileByUser.get(String(user._id));
    return {
      id: profile?._id ?? user._id,
      user,
      whatsappNumber: profile?.whatsappNumber,
      profilePhoto: profile?.profilePhoto,
      verificationStatus: profile?.verificationStatus ?? "pending",
      isApproved: profile?.isApproved ?? false,
      qualification: profile?.qualification,
      university: profile?.university,
      subjects: profile?.subjects ?? [],
      location: profile?.location,
      rating: profile?.rating ?? 0,
    };
  });
};

export const verifyTutor = async (tutorProfileId: string, adminId: string, status: "verified" | "rejected", note?: string) => {
  let profile = await TutorProfile.findById(tutorProfileId);
  if (!profile) {
    const user = await User.findOne({ _id: tutorProfileId, role: "tutor" });
    if (user) profile = await TutorProfile.create({ user: user._id });
  }
  if (!profile) throw ApiError.notFound("Tutor not found");
  profile.verificationStatus = status;
  profile.verificationRequestedAt = profile.verificationRequestedAt ?? new Date();
  profile.verifiedAt = status === "verified" ? new Date() : undefined;
  profile.verifiedBy = adminId as any;
  profile.verificationNote = note?.trim();
  profile.isApproved = status === "verified";
  await profile.save();

  const user = await User.findById(profile.user).select("_id");
  if (user) {
    await notify({
      recipient: user._id,
      type: "system",
      message: status === "verified"
        ? "Your tutor profile has been manually verified. You can now apply to tuition posts."
        : "Your tutor verification was not approved. Please contact Progoti Shikkha support.",
    });
  }

  await logAction({
    actor: adminId,
    action: status === "verified" ? "ADMIN_VERIFIED_TUTOR" : "ADMIN_REJECTED_TUTOR",
    targetType: "TutorProfile",
    targetId: profile._id,
    metadata: { note },
  });

  return profile;
};

export const verifyStudent = async (studentProfileId: string, adminId: string, status: "verified" | "rejected", note?: string) => {
  let profile = await StudentProfile.findById(studentProfileId);
  if (!profile) {
    const user = await User.findOne({ _id: studentProfileId, role: "student" });
    if (user) profile = await StudentProfile.create({ user: user._id });
  }
  if (!profile) throw ApiError.notFound("Student not found");
  profile.verificationStatus = status;
  profile.verificationRequestedAt = profile.verificationRequestedAt ?? new Date();
  profile.verifiedAt = status === "verified" ? new Date() : undefined;
  profile.verifiedBy = adminId as any;
  profile.verificationNote = note?.trim();
  await profile.save();

  const user = await User.findById(profile.user).select("_id");
  if (user) {
    await notify({
      recipient: user._id,
      type: "system",
      message: status === "verified"
        ? "Your student profile has been manually verified."
        : "Your student verification was not approved. Please contact Progoti Shikkha support.",
    });
  }

  await logAction({
    actor: adminId,
    action: status === "verified" ? "ADMIN_VERIFIED_STUDENT" : "ADMIN_REJECTED_STUDENT",
    targetType: "StudentProfile",
    targetId: profile._id,
    metadata: { note },
  });

  return profile;
};

export const getUserContact = async (userId: string, adminId: string) => {
  const user = await User.findById(userId).select("fullName email phone role isSuspended");
  if (!user) throw ApiError.notFound("User not found");
  let whatsappNumber: string | undefined;
  if (user.role === "student") {
    const profile = await StudentProfile.findOne({ user: user._id }).select("whatsappNumber");
    whatsappNumber = profile?.whatsappNumber;
  } else if (user.role === "tutor") {
    const profile = await TutorProfile.findOne({ user: user._id }).select("whatsappNumber");
    whatsappNumber = profile?.whatsappNumber;
  }

  // Every access to a user's private contact info by an admin is audited
  // (spec sections 10 & 23), regardless of whether they go on to actually
  // call/WhatsApp them.
  if (user.role === "student" || user.role === "tutor") {
    await logAction({
      actor: adminId,
      action: user.role === "student" ? "ADMIN_CONTACTED_STUDENT" : "ADMIN_CONTACTED_TUTOR",
      targetType: "User",
      targetId: user._id,
    });
  }

  return { id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, whatsappNumber, role: user.role, isSuspended: user.isSuspended };
};

export const listTuitionPosts = async () => {
  const posts = await TuitionPost.find()
    .populate({
      path: "student",
      populate: { path: "user", select: "fullName email phone" },
    })
    .populate({
      path: "hiredTutor",
      populate: { path: "user", select: "fullName email phone" },
    })
    .sort({ createdAt: -1 });

  const postIds = posts.map((p) => p._id);
  const counts = await Application.aggregate([
    { $match: { tuitionPost: { $in: postIds } } },
    {
      $group: {
        _id: "$tuitionPost",
        count: { $sum: 1 },
        connectedCount: {
          $sum: { $cond: [{ $eq: ["$connectionStatus", "connected"] }, 1, 0] },
        },
        hiredCount: {
          $sum: { $cond: [{ $eq: ["$status", "hired"] }, 1, 0] },
        },
      },
    },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c]));

  return posts.map((post) => {
    const countsForPost = countMap.get(post._id.toString());
    const student = post.student as any;
    const hiredTutor = post.hiredTutor as any;
    return {
      post,
      student: student
        ? {
            id: String(student._id),
            fullName: student.user?.fullName ?? "Unknown student",
            email: student.user?.email ?? "",
            phone: student.user?.phone ?? "",
            whatsappNumber: student.whatsappNumber,
            profilePhoto: student.profilePhoto,
            location: student.location,
            verificationStatus: student.verificationStatus,
          }
        : null,
      hiredTutor: hiredTutor
        ? {
            id: String(hiredTutor._id),
            fullName: hiredTutor.user?.fullName ?? "Unknown tutor",
            email: hiredTutor.user?.email ?? "",
            phone: hiredTutor.user?.phone ?? "",
            whatsappNumber: hiredTutor.whatsappNumber,
            profilePhoto: hiredTutor.profilePhoto,
          }
        : null,
      applicantCount: countsForPost?.count ?? 0,
      hiredCount: countsForPost?.hiredCount ?? 0,
      connectedCount: countsForPost?.connectedCount ?? 0,
    };
  });
};

export const getTuitionPostDetail = async (postId: string) => {
  const post = await TuitionPost.findById(postId)
    .populate({ path: "student", populate: { path: "user", select: "fullName email phone" } })
    .populate({ path: "hiredTutor", populate: { path: "user", select: "fullName email phone" } });
  if (!post) throw ApiError.notFound("Tuition post not found");

  const applications = await Application.find({ tuitionPost: postId })
    .populate({ path: "tutor", populate: { path: "user", select: "fullName email phone" } })
    .sort({ createdAt: -1 });

  const applicantRows = await Promise.all(
    applications.map(async (application) => {
      const tutorProfile = application.tutor as any;
      const whatsappNumber = tutorProfile?.whatsappNumber;
      return { application, whatsappNumber };
    })
  );

  const studentUser = (post.student as any)?.user;
  const studentProfile = post.student as any;
  const student = studentUser
    ? {
        id: String(studentUser._id),
        fullName: studentUser.fullName,
        email: studentUser.email,
        phone: studentUser.phone,
        whatsappNumber: studentProfile?.whatsappNumber,
        profilePhoto: studentProfile?.profilePhoto,
        location: studentProfile?.location,
        verificationStatus: studentProfile?.verificationStatus,
      }
    : null;

  const hiredTutor = (post.hiredTutor as any)?.user
    ? {
        id: String((post.hiredTutor as any).user._id),
        fullName: (post.hiredTutor as any).user.fullName,
        email: (post.hiredTutor as any).user.email,
        phone: (post.hiredTutor as any).user.phone,
        whatsappNumber: (post.hiredTutor as any).whatsappNumber,
        profilePhoto: (post.hiredTutor as any).profilePhoto,
      }
    : null;

  return {
    post,
    student,
    hiredTutor,
    applications: applicantRows.map((row) => ({
      ...row.application.toObject(),
      tutor: row.application.tutor,
      whatsappNumber: row.whatsappNumber,
    })),
  };
};


export const deleteTuitionPost = async (postId: string, adminId: string) => {
  const post = await TuitionPost.findById(postId);
  if (!post) throw ApiError.notFound("Tuition post not found");
  await Application.deleteMany({ tuitionPost: post._id });
  await Donation.deleteMany({ tuitionPost: post._id });
  await post.deleteOne();

  await logAction({
    actor: adminId,
    action: "TUITION_POST_DELETED",
    targetType: "TuitionPost",
    targetId: post._id,
  });
};

// pending_admin -> contacting: admin has started reaching out to both sides.
export const startApplicationContact = async (applicationId: string, adminId: string, notes?: string) => {
  const application = await Application.findOne({
    _id: applicationId,
    status: "hired",
    connectionStatus: { $in: ["pending_admin", "failed"] },
  });
  if (!application) {
    throw ApiError.badRequest("This application is not awaiting admin contact");
  }
  application.connectionStatus = "contacting";
  application.contactAttemptedAt = new Date();
  application.contactStartedBy = adminId as any;
  if (notes) application.contactNotes = notes.trim();
  await application.save();

  await logAction({
    actor: adminId,
    action: "CONNECTION_STARTED",
    targetType: "Application",
    targetId: application._id,
  });

  return application;
};

// contacting/pending_admin -> failed: admin tried but the connection did not
// work out (e.g. tutor or student unreachable/declined). Can be retried by
// calling startApplicationContact again.
export const markApplicationConnectionFailed = async (applicationId: string, adminId: string, failureReason?: string) => {
  const application = await Application.findOne({
    _id: applicationId,
    status: "hired",
    connectionStatus: { $in: ["pending_admin", "contacting"] },
  });
  if (!application) {
    throw ApiError.badRequest("This application is not in a state that can be marked failed");
  }
  application.connectionStatus = "failed";
  application.failureReason = failureReason?.trim();
  await application.save();

  await logAction({
    actor: adminId,
    action: "CONNECTION_FAILED",
    targetType: "Application",
    targetId: application._id,
    metadata: { failureReason },
  });

  return application;
};

// Admin cancels the hire/connection outright (e.g. student or tutor backed
// out). Reopens the tuition post so the student can hire someone else.
export const cancelApplicationConnection = async (applicationId: string, adminId: string, reason?: string) => {
  const application = await Application.findOne({ _id: applicationId, status: "hired" });
  if (!application) throw ApiError.notFound("Application not found");
  if (application.connectionStatus === "connected") {
    throw ApiError.badRequest("An already-connected application cannot be cancelled this way");
  }

  application.connectionStatus = "cancelled";
  application.failureReason = reason?.trim();
  await application.save();

  await TuitionPost.findOneAndUpdate(
    { _id: application.tuitionPost, status: "filled", hiredTutor: application.tutor },
    { status: "open", $unset: { hiredTutor: "" } }
  );

  await logAction({
    actor: adminId,
    action: "CONNECTION_CANCELLED",
    targetType: "Application",
    targetId: application._id,
    metadata: { reason },
  });

  return application;
};

// contacting -> connected: admin confirms both sides are actually in touch
// and the tuition is now active.
export const markApplicationConnected = async (applicationId: string, adminId: string) => {
  const application = await Application.findOne({
    _id: applicationId,
    status: "hired",
    connectionStatus: { $in: ["pending_admin", "contacting"] },
  });
  if (!application) throw ApiError.badRequest("Only a hired application awaiting connection can be marked connected");
  application.connectionStatus = "connected";
  application.connectedAt = new Date();
  application.connectedBy = adminId as any;
  await application.save();

  await logAction({
    actor: adminId,
    action: "APPLICATION_CONNECTED",
    targetType: "Application",
    targetId: application._id,
  });

  const post = await TuitionPost.findById(application.tuitionPost).select("title student");
  const tutor = await TutorProfile.findById(application.tutor).select("user");
  if (tutor) {
    await notify({ recipient: tutor.user, type: "system", message: `Your tuition connection for "${post?.title ?? "the tuition post"}" has been completed by Progoti Shikkha.`, relatedId: application._id });
  }
  if (post) {
    const student = await StudentProfile.findById(post.student).select("user");
    if (student) {
      await notify({ recipient: student.user, type: "system", message: `Your tuition connection for "${post.title}" has been completed by Progoti Shikkha.`, relatedId: application._id });
    }
  }
  return application;
};

export const markDonationSalaryReceived = async (donationId: string, adminId: string, dueDate?: string) => {
  const donation = await Donation.findById(donationId);
  if (!donation) throw ApiError.notFound("Donation not found");
  if (donation.status !== "not_due") throw ApiError.badRequest("First-month salary can only be confirmed once for a pending donation");
  donation.salaryReceivedAt = new Date();
  donation.dueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  donation.status = "due";
  await donation.save();

  // This is the concrete, admin-verified signal that the tutor has actually
  // completed a first month of real teaching for this student (the whole
  // reason a donation becomes owed) — so this, not the earlier "hired"
  // event, is when a completed tuition is counted (spec section 21). The
  // `donation.status !== "not_due"` guard above means this branch can only
  // run once per donation, so the counter cannot be double-incremented by
  // retrying this call.
  await TutorProfile.findByIdAndUpdate(donation.tutor, { $inc: { completedTuitionCount: 1 } });

  const tutor = await TutorProfile.findById(donation.tutor).select("user");
  if (tutor) {
    await notify({
      recipient: tutor.user,
      type: "system",
      message: `Your first-month donation of ৳${donation.donationAmount.toLocaleString()} is now due.`,
      link: "/tutor/donations",
      relatedId: donation._id,
    });
  }

  await logAction({
    actor: adminId,
    action: "DONATION_SALARY_RECEIVED",
    targetType: "Donation",
    targetId: donation._id,
    metadata: { dueDate: donation.dueDate },
  });

  return donation;
};

export const verifyDonationPayment = async (donationId: string, adminId: string, approved: boolean, note?: string) => {
  const donation = await Donation.findById(donationId);
  if (!donation) throw ApiError.notFound("Donation not found");
  if (donation.status !== "payment_submitted") throw ApiError.badRequest("Only submitted donation payments can be verified");
  if (approved) {
    donation.status = "completed";
    donation.paidAt = donation.paidAt ?? new Date();
    donation.verifiedAt = new Date();
    donation.verifiedBy = adminId as any;
  } else {
    donation.status = "rejected";
  }
  if (note) donation.adminNote = note.trim();
  await donation.save();
  const tutor = await TutorProfile.findById(donation.tutor).select("user");
  if (tutor) {
    await notify({
      recipient: tutor.user,
      type: "system",
      message: approved
        ? `Your donation payment of ৳${donation.donationAmount.toLocaleString()} has been verified.`
        : "Your donation payment could not be verified. Please review the transaction and submit it again.",
      link: "/tutor/donations",
      relatedId: donation._id,
    });
  }

  await logAction({
    actor: adminId,
    action: approved ? "DONATION_APPROVED" : "DONATION_REJECTED",
    targetType: "Donation",
    targetId: donation._id,
    metadata: { note },
  });

  return donation;
};

export const listDonations = async (status?: string) => {
  // Backend filtering (spec section 16) rather than relying on the client to
  // filter a full dump — "unpaid" is a convenience alias for due+overdue.
  const query: Record<string, unknown> = {};
  if (status && status !== "all") {
    if (status === "unpaid") {
      query.status = { $in: ["due", "overdue"] };
    } else {
      query.status = status;
    }
  }
  return Donation.find(query)
    .populate({ path: "tutor", populate: { path: "user", select: "fullName phone email isSuspended" } })
    .populate("tuitionPost", "title salary location status")
    .populate("application", "status connectionStatus")
    .sort({ createdAt: -1 });
};

export const markDonationOverdue = async (donationId: string, adminId?: string) => {
  const donation = await Donation.findById(donationId);
  if (!donation) throw ApiError.notFound("Donation not found");
  if (donation.status !== "due") throw ApiError.badRequest("Only due donations can be marked overdue");
  donation.status = "overdue";
  await donation.save();

  const tutor = await TutorProfile.findById(donation.tutor).select("user");
  if (tutor) {
    await notify({
      recipient: tutor.user,
      type: "system",
      message: `Your donation payment of ৳${donation.donationAmount.toLocaleString()} is now overdue. Please pay as soon as possible to avoid suspension.`,
      link: "/tutor/donations",
      relatedId: donation._id,
    });
  }

  // Only write an audit-log entry when a real admin actor triggered this
  // (manual button). The automated cron sweep calls this per-donation for
  // potentially many donations; its own summary is logged once by the job
  // runner instead of spamming an AuditLog entry (which requires a valid
  // User actor) per donation.
  if (adminId) {
    await logAction({
      actor: adminId,
      action: "DONATION_MARKED_OVERDUE",
      targetType: "Donation",
      targetId: donation._id,
    });
  }

  return donation;
};

/**
 * Scheduled/automated overdue sweep (spec section 18). Finds every donation
 * still "due" whose dueDate has passed and flips it to "overdue", notifying
 * the tutor. Designed to be safely re-run on a schedule (e.g. a Render Cron
 * Job — see backend/src/jobs/processOverdueDonations.ts): the query only
 * ever matches donations still in "due", so re-running it after it has
 * already processed a donation is a no-op for that donation (idempotent).
 */
export const processOverdueDonations = async (): Promise<{ processed: number }> => {
  const overdueCandidates = await Donation.find({ status: "due", dueDate: { $lt: new Date() } }).select("_id");
  let processed = 0;
  for (const candidate of overdueCandidates) {
    try {
      // Re-check status inside the loop via markDonationOverdue's own guard
      // so a candidate that changed state between the query above and now
      // (e.g. the tutor paid seconds ago) is safely skipped rather than
      // forced into "overdue".
      await markDonationOverdue(candidate._id.toString());
      processed += 1;
    } catch (error) {
      if (!(error instanceof ApiError && error.statusCode === 400)) {
        // eslint-disable-next-line no-console
        console.error("⚠️  Failed to process overdue donation", candidate._id.toString(), error);
      }
    }
  }
  return { processed };
};

export const remindDonation = async (donationId: string) => {
  const donation = await Donation.findById(donationId).populate({ path: "tutor", populate: { path: "user", select: "_id fullName" } });
  if (!donation) throw ApiError.notFound("Donation not found");
  const tutor = donation.tutor as any;
  if (tutor?.user?._id) {
    await notify({
      recipient: tutor.user._id,
      type: "system",
      message: `Reminder: your Progoti Shikkha donation of ৳${donation.donationAmount.toLocaleString()} is ${donation.status === "overdue" ? "overdue" : "due"}.`,
      link: "/tutor/donations",
      relatedId: donation._id,
    });
  }
  donation.reminderCount += 1;
  donation.lastReminderAt = new Date();
  await donation.save();
  return donation;
};

export const suspendDonationTutor = async (donationId: string, adminId: string) => {
  const donation = await Donation.findById(donationId);
  if (!donation) throw ApiError.notFound("Donation not found");
  const tutor = await TutorProfile.findById(donation.tutor);
  if (!tutor) throw ApiError.notFound("Tutor not found");
  const user = await User.findById(tutor.user);
  if (!user) throw ApiError.notFound("Tutor account not found");

  user.isSuspended = true;
  user.refreshSessions = [];
  await user.save();

  // A suspended tutor must also drop out of the public marketplace (spec
  // section 19) — isApproved is what gates every public listing/detail
  // query, so it must be turned off, not just the login-blocking flag.
  // Nothing about the tutor's data (applications, reviews, donations,
  // history) is deleted — this can be fully reversed by reinstateTutor.
  tutor.isApproved = false;
  await tutor.save();

  donation.status = "suspended";
  donation.suspendedAt = new Date();
  await donation.save();

  await notify({
    recipient: user._id,
    type: "system",
    message: "Your account has been suspended due to an unpaid donation obligation. Please contact Progoti Shikkha support.",
  });

  await logAction({
    actor: adminId,
    action: "TUTOR_SUSPENDED",
    targetType: "TutorProfile",
    targetId: tutor._id,
    metadata: { donationId: donation._id },
  });

  return donation;
};

/**
 * Reverses a donation-related suspension (spec section 19: "must be
 * reversible by an authorized admin"). Restores login access and, if the
 * tutor was previously verified, restores marketplace visibility. Does not
 * silently forgive the underlying donation — that must still be handled via
 * verifyDonationPayment / markDonationSalaryReceived so the money owed is
 * accounted for, not swept away by a reinstatement.
 */
export const reinstateTutor = async (donationId: string, adminId: string) => {
  const donation = await Donation.findById(donationId);
  if (!donation) throw ApiError.notFound("Donation not found");
  if (donation.status !== "suspended") throw ApiError.badRequest("Only a suspended donation can be reinstated");

  const tutor = await TutorProfile.findById(donation.tutor);
  if (!tutor) throw ApiError.notFound("Tutor not found");
  const user = await User.findById(tutor.user);
  if (!user) throw ApiError.notFound("Tutor account not found");

  user.isSuspended = false;
  await user.save();

  if (tutor.verificationStatus === "verified") {
    tutor.isApproved = true;
    await tutor.save();
  }

  // Reinstatement puts the obligation back to "due" rather than clearing it
  // — the tutor still owes the donation, they're just no longer locked out
  // while they arrange payment.
  donation.status = "due";
  donation.suspendedAt = undefined;
  if (!donation.dueDate || donation.dueDate < new Date()) {
    donation.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  await donation.save();

  await notify({
    recipient: user._id,
    type: "system",
    message: "Your account has been reinstated. Your donation payment is still due — please submit it as soon as possible.",
    link: "/tutor/donations",
    relatedId: donation._id,
  });

  await logAction({
    actor: adminId,
    action: "TUTOR_REINSTATED",
    targetType: "TutorProfile",
    targetId: tutor._id,
    metadata: { donationId: donation._id },
  });

  return donation;
};

export const getAnalyticsSummary = async () => {
  const [studentCount, tutorCount, openPostsCount, filledPostsCount, pendingApprovals, pendingStudentVerifications, pendingTutorVerifications, donationDue, donationPaymentSubmitted, donationCompleted, donationOverdue] =
    await Promise.all([
      StudentProfile.countDocuments(),
      TutorProfile.countDocuments(),
      TuitionPost.countDocuments({ status: "open" }),
      TuitionPost.countDocuments({ status: "filled" }),
      TutorProfile.countDocuments({ isApproved: false }),
      StudentProfile.countDocuments({ $or: [{ verificationStatus: "pending" }, { verificationStatus: { $exists: false } }] }),
      TutorProfile.countDocuments({ $or: [{ verificationStatus: "pending" }, { verificationStatus: { $exists: false } }] }),
      Donation.countDocuments({ status: "due" }),
      Donation.countDocuments({ status: "payment_submitted" }),
      Donation.countDocuments({ status: "completed" }),
      Donation.countDocuments({ status: "overdue" }),
    ]);

  return {
    studentCount, tutorCount, openPostsCount, filledPostsCount, pendingApprovals,
    pendingStudentVerifications, pendingTutorVerifications, donationDue, donationPaymentSubmitted, donationCompleted, donationOverdue,
  };
};

export const broadcastNotification = async (input: BroadcastNotificationInput): Promise<{ recipientCount: number }> => {
  const roleFilter = input.audience === "all" ? {} : { role: input.audience === "students" ? "student" : "tutor" };
  const recipients = await User.find({ ...roleFilter, isVerified: true }).select("_id");
  await Promise.all(
    recipients.map((recipient) =>
      notify({ recipient: recipient._id, type: "system", message: input.message })
    )
  );
  return { recipientCount: recipients.length };
};

export const toggleSuspendUser = async (userId: string, adminId: string) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  user.isSuspended = !user.isSuspended;
  if (user.isSuspended) user.refreshSessions = [];
  await user.save();

  await logAction({
    actor: adminId,
    action: user.isSuspended ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
    targetType: "User",
    targetId: user._id,
  });

  return user;
};

export const deleteUser = async (userId: string, adminId: string) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  if (user.role === "student") {
    const profile = await StudentProfile.findOne({ user: user._id });
    if (profile) {
      const posts = await TuitionPost.find({ student: profile._id }).select("_id");
      await Application.deleteMany({ tuitionPost: { $in: posts.map((p) => p._id) } });
      await Donation.deleteMany({ tuitionPost: { $in: posts.map((p) => p._id) } });
      await TuitionPost.deleteMany({ student: profile._id });
      await profile.deleteOne();
    }
  } else if (user.role === "tutor") {
    const profile = await TutorProfile.findOne({ user: user._id });
    if (profile) {
      const applications = await Application.find({ tutor: profile._id }).select("_id");
      await Donation.deleteMany({ application: { $in: applications.map((a) => a._id) } });
      await Application.deleteMany({ tutor: profile._id });
      await profile.deleteOne();
    }
  }
  const deletedId = user._id;
  const deletedRole = user.role;
  await user.deleteOne();

  await logAction({
    actor: adminId,
    action: "USER_DELETED",
    targetType: "User",
    targetId: deletedId,
    metadata: { role: deletedRole },
  });
};
