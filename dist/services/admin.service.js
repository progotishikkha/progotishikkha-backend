"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.toggleSuspendUser = exports.broadcastNotification = exports.getAnalyticsSummary = exports.reinstateTutor = exports.suspendDonationTutor = exports.remindDonation = exports.processOverdueDonations = exports.markDonationOverdue = exports.listDonations = exports.verifyDonationPayment = exports.markDonationSalaryReceived = exports.markApplicationConnected = exports.cancelApplicationConnection = exports.markApplicationConnectionFailed = exports.startApplicationContact = exports.deleteTuitionPost = exports.getTuitionPostDetail = exports.listTuitionPosts = exports.getUserContact = exports.verifyStudent = exports.verifyTutor = exports.listTutors = exports.listStudents = void 0;
const user_model_1 = require("../models/user.model");
const studentProfile_model_1 = require("../models/studentProfile.model");
const tutorProfile_model_1 = require("../models/tutorProfile.model");
const tuitionPost_model_1 = require("../models/tuitionPost.model");
const application_model_1 = require("../models/application.model");
const donation_model_1 = require("../models/donation.model");
const ApiError_1 = require("../utils/ApiError");
const notification_service_1 = require("./notification.service");
const auditLog_service_1 = require("./auditLog.service");
const listStudents = async () => {
    // Read from User first so the admin UI still works even if a legacy account
    // is missing its role-specific profile document.
    const users = await user_model_1.User.find({ role: "student" })
        .select("fullName email phone isSuspended createdAt role")
        .sort({ createdAt: -1 });
    const userIds = users.map((u) => u._id);
    const profiles = await studentProfile_model_1.StudentProfile.find({ user: { $in: userIds } });
    const profileByUser = new Map(profiles.map((p) => [String(p.user), p]));
    const postsCounts = await tuitionPost_model_1.TuitionPost.aggregate([
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
exports.listStudents = listStudents;
const listTutors = async () => {
    const users = await user_model_1.User.find({ role: "tutor" })
        .select("fullName email phone isSuspended createdAt role")
        .sort({ createdAt: -1 });
    const userIds = users.map((u) => u._id);
    const profiles = await tutorProfile_model_1.TutorProfile.find({ user: { $in: userIds } });
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
exports.listTutors = listTutors;
const verifyTutor = async (tutorProfileId, adminId, status, note) => {
    let profile = await tutorProfile_model_1.TutorProfile.findById(tutorProfileId);
    if (!profile) {
        const user = await user_model_1.User.findOne({ _id: tutorProfileId, role: "tutor" });
        if (user)
            profile = await tutorProfile_model_1.TutorProfile.create({ user: user._id });
    }
    if (!profile)
        throw ApiError_1.ApiError.notFound("Tutor not found");
    profile.verificationStatus = status;
    profile.verificationRequestedAt = profile.verificationRequestedAt ?? new Date();
    profile.verifiedAt = status === "verified" ? new Date() : undefined;
    profile.verifiedBy = adminId;
    profile.verificationNote = note?.trim();
    profile.isApproved = status === "verified";
    await profile.save();
    const user = await user_model_1.User.findById(profile.user).select("_id");
    if (user) {
        await (0, notification_service_1.notify)({
            recipient: user._id,
            type: "system",
            message: status === "verified"
                ? "Your tutor profile has been manually verified. You can now apply to tuition posts."
                : "Your tutor verification was not approved. Please contact Progoti Shikkha support.",
        });
    }
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: status === "verified" ? "ADMIN_VERIFIED_TUTOR" : "ADMIN_REJECTED_TUTOR",
        targetType: "TutorProfile",
        targetId: profile._id,
        metadata: { note },
    });
    return profile;
};
exports.verifyTutor = verifyTutor;
const verifyStudent = async (studentProfileId, adminId, status, note) => {
    let profile = await studentProfile_model_1.StudentProfile.findById(studentProfileId);
    if (!profile) {
        const user = await user_model_1.User.findOne({ _id: studentProfileId, role: "student" });
        if (user)
            profile = await studentProfile_model_1.StudentProfile.create({ user: user._id });
    }
    if (!profile)
        throw ApiError_1.ApiError.notFound("Student not found");
    profile.verificationStatus = status;
    profile.verificationRequestedAt = profile.verificationRequestedAt ?? new Date();
    profile.verifiedAt = status === "verified" ? new Date() : undefined;
    profile.verifiedBy = adminId;
    profile.verificationNote = note?.trim();
    await profile.save();
    const user = await user_model_1.User.findById(profile.user).select("_id");
    if (user) {
        await (0, notification_service_1.notify)({
            recipient: user._id,
            type: "system",
            message: status === "verified"
                ? "Your student profile has been manually verified."
                : "Your student verification was not approved. Please contact Progoti Shikkha support.",
        });
    }
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: status === "verified" ? "ADMIN_VERIFIED_STUDENT" : "ADMIN_REJECTED_STUDENT",
        targetType: "StudentProfile",
        targetId: profile._id,
        metadata: { note },
    });
    return profile;
};
exports.verifyStudent = verifyStudent;
const getUserContact = async (userId, adminId) => {
    const user = await user_model_1.User.findById(userId).select("fullName email phone role isSuspended");
    if (!user)
        throw ApiError_1.ApiError.notFound("User not found");
    let whatsappNumber;
    if (user.role === "student") {
        const profile = await studentProfile_model_1.StudentProfile.findOne({ user: user._id }).select("whatsappNumber");
        whatsappNumber = profile?.whatsappNumber;
    }
    else if (user.role === "tutor") {
        const profile = await tutorProfile_model_1.TutorProfile.findOne({ user: user._id }).select("whatsappNumber");
        whatsappNumber = profile?.whatsappNumber;
    }
    // Every access to a user's private contact info by an admin is audited
    // (spec sections 10 & 23), regardless of whether they go on to actually
    // call/WhatsApp them.
    if (user.role === "student" || user.role === "tutor") {
        await (0, auditLog_service_1.logAction)({
            actor: adminId,
            action: user.role === "student" ? "ADMIN_CONTACTED_STUDENT" : "ADMIN_CONTACTED_TUTOR",
            targetType: "User",
            targetId: user._id,
        });
    }
    return { id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, whatsappNumber, role: user.role, isSuspended: user.isSuspended };
};
exports.getUserContact = getUserContact;
const listTuitionPosts = async () => {
    const posts = await tuitionPost_model_1.TuitionPost.find()
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
    const counts = await application_model_1.Application.aggregate([
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
        const student = post.student;
        const hiredTutor = post.hiredTutor;
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
exports.listTuitionPosts = listTuitionPosts;
const getTuitionPostDetail = async (postId) => {
    const post = await tuitionPost_model_1.TuitionPost.findById(postId)
        .populate({ path: "student", populate: { path: "user", select: "fullName email phone" } })
        .populate({ path: "hiredTutor", populate: { path: "user", select: "fullName email phone" } });
    if (!post)
        throw ApiError_1.ApiError.notFound("Tuition post not found");
    const applications = await application_model_1.Application.find({ tuitionPost: postId })
        .populate({ path: "tutor", populate: { path: "user", select: "fullName email phone" } })
        .sort({ createdAt: -1 });
    const applicantRows = await Promise.all(applications.map(async (application) => {
        const tutorProfile = application.tutor;
        const whatsappNumber = tutorProfile?.whatsappNumber;
        return { application, whatsappNumber };
    }));
    const studentUser = post.student?.user;
    const studentProfile = post.student;
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
    const hiredTutor = post.hiredTutor?.user
        ? {
            id: String(post.hiredTutor.user._id),
            fullName: post.hiredTutor.user.fullName,
            email: post.hiredTutor.user.email,
            phone: post.hiredTutor.user.phone,
            whatsappNumber: post.hiredTutor.whatsappNumber,
            profilePhoto: post.hiredTutor.profilePhoto,
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
exports.getTuitionPostDetail = getTuitionPostDetail;
const deleteTuitionPost = async (postId, adminId) => {
    const post = await tuitionPost_model_1.TuitionPost.findById(postId);
    if (!post)
        throw ApiError_1.ApiError.notFound("Tuition post not found");
    await application_model_1.Application.deleteMany({ tuitionPost: post._id });
    await donation_model_1.Donation.deleteMany({ tuitionPost: post._id });
    await post.deleteOne();
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: "TUITION_POST_DELETED",
        targetType: "TuitionPost",
        targetId: post._id,
    });
};
exports.deleteTuitionPost = deleteTuitionPost;
// pending_admin -> contacting: admin has started reaching out to both sides.
const startApplicationContact = async (applicationId, adminId, notes) => {
    const application = await application_model_1.Application.findOne({
        _id: applicationId,
        status: "hired",
        connectionStatus: { $in: ["pending_admin", "failed"] },
    });
    if (!application) {
        throw ApiError_1.ApiError.badRequest("This application is not awaiting admin contact");
    }
    application.connectionStatus = "contacting";
    application.contactAttemptedAt = new Date();
    application.contactStartedBy = adminId;
    if (notes)
        application.contactNotes = notes.trim();
    await application.save();
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: "CONNECTION_STARTED",
        targetType: "Application",
        targetId: application._id,
    });
    return application;
};
exports.startApplicationContact = startApplicationContact;
// contacting/pending_admin -> failed: admin tried but the connection did not
// work out (e.g. tutor or student unreachable/declined). Can be retried by
// calling startApplicationContact again.
const markApplicationConnectionFailed = async (applicationId, adminId, failureReason) => {
    const application = await application_model_1.Application.findOne({
        _id: applicationId,
        status: "hired",
        connectionStatus: { $in: ["pending_admin", "contacting"] },
    });
    if (!application) {
        throw ApiError_1.ApiError.badRequest("This application is not in a state that can be marked failed");
    }
    application.connectionStatus = "failed";
    application.failureReason = failureReason?.trim();
    await application.save();
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: "CONNECTION_FAILED",
        targetType: "Application",
        targetId: application._id,
        metadata: { failureReason },
    });
    return application;
};
exports.markApplicationConnectionFailed = markApplicationConnectionFailed;
// Admin cancels the hire/connection outright (e.g. student or tutor backed
// out). Reopens the tuition post so the student can hire someone else.
const cancelApplicationConnection = async (applicationId, adminId, reason) => {
    const application = await application_model_1.Application.findOne({ _id: applicationId, status: "hired" });
    if (!application)
        throw ApiError_1.ApiError.notFound("Application not found");
    if (application.connectionStatus === "connected") {
        throw ApiError_1.ApiError.badRequest("An already-connected application cannot be cancelled this way");
    }
    application.connectionStatus = "cancelled";
    application.failureReason = reason?.trim();
    await application.save();
    await tuitionPost_model_1.TuitionPost.findOneAndUpdate({ _id: application.tuitionPost, status: "filled", hiredTutor: application.tutor }, { status: "open", $unset: { hiredTutor: "" } });
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: "CONNECTION_CANCELLED",
        targetType: "Application",
        targetId: application._id,
        metadata: { reason },
    });
    return application;
};
exports.cancelApplicationConnection = cancelApplicationConnection;
// contacting -> connected: admin confirms both sides are actually in touch
// and the tuition is now active.
const markApplicationConnected = async (applicationId, adminId) => {
    const application = await application_model_1.Application.findOne({
        _id: applicationId,
        status: "hired",
        connectionStatus: { $in: ["pending_admin", "contacting"] },
    });
    if (!application)
        throw ApiError_1.ApiError.badRequest("Only a hired application awaiting connection can be marked connected");
    application.connectionStatus = "connected";
    application.connectedAt = new Date();
    application.connectedBy = adminId;
    await application.save();
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: "APPLICATION_CONNECTED",
        targetType: "Application",
        targetId: application._id,
    });
    const post = await tuitionPost_model_1.TuitionPost.findById(application.tuitionPost).select("title student");
    const tutor = await tutorProfile_model_1.TutorProfile.findById(application.tutor).select("user");
    if (tutor) {
        await (0, notification_service_1.notify)({ recipient: tutor.user, type: "system", message: `Your tuition connection for "${post?.title ?? "the tuition post"}" has been completed by Progoti Shikkha.`, relatedId: application._id });
    }
    if (post) {
        const student = await studentProfile_model_1.StudentProfile.findById(post.student).select("user");
        if (student) {
            await (0, notification_service_1.notify)({ recipient: student.user, type: "system", message: `Your tuition connection for "${post.title}" has been completed by Progoti Shikkha.`, relatedId: application._id });
        }
    }
    return application;
};
exports.markApplicationConnected = markApplicationConnected;
const markDonationSalaryReceived = async (donationId, adminId, dueDate) => {
    const donation = await donation_model_1.Donation.findById(donationId);
    if (!donation)
        throw ApiError_1.ApiError.notFound("Donation not found");
    if (donation.status !== "not_due")
        throw ApiError_1.ApiError.badRequest("First-month salary can only be confirmed once for a pending donation");
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
    await tutorProfile_model_1.TutorProfile.findByIdAndUpdate(donation.tutor, { $inc: { completedTuitionCount: 1 } });
    const tutor = await tutorProfile_model_1.TutorProfile.findById(donation.tutor).select("user");
    if (tutor) {
        await (0, notification_service_1.notify)({
            recipient: tutor.user,
            type: "system",
            message: `Your first-month donation of ৳${donation.donationAmount.toLocaleString()} is now due.`,
            link: "/tutor/donations",
            relatedId: donation._id,
        });
    }
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: "DONATION_SALARY_RECEIVED",
        targetType: "Donation",
        targetId: donation._id,
        metadata: { dueDate: donation.dueDate },
    });
    return donation;
};
exports.markDonationSalaryReceived = markDonationSalaryReceived;
const verifyDonationPayment = async (donationId, adminId, approved, note) => {
    const donation = await donation_model_1.Donation.findById(donationId);
    if (!donation)
        throw ApiError_1.ApiError.notFound("Donation not found");
    if (donation.status !== "payment_submitted")
        throw ApiError_1.ApiError.badRequest("Only submitted donation payments can be verified");
    if (approved) {
        donation.status = "completed";
        donation.paidAt = donation.paidAt ?? new Date();
        donation.verifiedAt = new Date();
        donation.verifiedBy = adminId;
    }
    else {
        donation.status = "rejected";
    }
    if (note)
        donation.adminNote = note.trim();
    await donation.save();
    const tutor = await tutorProfile_model_1.TutorProfile.findById(donation.tutor).select("user");
    if (tutor) {
        await (0, notification_service_1.notify)({
            recipient: tutor.user,
            type: "system",
            message: approved
                ? `Your donation payment of ৳${donation.donationAmount.toLocaleString()} has been verified.`
                : "Your donation payment could not be verified. Please review the transaction and submit it again.",
            link: "/tutor/donations",
            relatedId: donation._id,
        });
    }
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: approved ? "DONATION_APPROVED" : "DONATION_REJECTED",
        targetType: "Donation",
        targetId: donation._id,
        metadata: { note },
    });
    return donation;
};
exports.verifyDonationPayment = verifyDonationPayment;
const listDonations = async (status) => {
    // Backend filtering (spec section 16) rather than relying on the client to
    // filter a full dump — "unpaid" is a convenience alias for due+overdue.
    const query = {};
    if (status && status !== "all") {
        if (status === "unpaid") {
            query.status = { $in: ["due", "overdue"] };
        }
        else {
            query.status = status;
        }
    }
    return donation_model_1.Donation.find(query)
        .populate({ path: "tutor", populate: { path: "user", select: "fullName phone email isSuspended" } })
        .populate("tuitionPost", "title salary location status")
        .populate("application", "status connectionStatus")
        .sort({ createdAt: -1 });
};
exports.listDonations = listDonations;
const markDonationOverdue = async (donationId, adminId) => {
    const donation = await donation_model_1.Donation.findById(donationId);
    if (!donation)
        throw ApiError_1.ApiError.notFound("Donation not found");
    if (donation.status !== "due")
        throw ApiError_1.ApiError.badRequest("Only due donations can be marked overdue");
    donation.status = "overdue";
    await donation.save();
    const tutor = await tutorProfile_model_1.TutorProfile.findById(donation.tutor).select("user");
    if (tutor) {
        await (0, notification_service_1.notify)({
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
        await (0, auditLog_service_1.logAction)({
            actor: adminId,
            action: "DONATION_MARKED_OVERDUE",
            targetType: "Donation",
            targetId: donation._id,
        });
    }
    return donation;
};
exports.markDonationOverdue = markDonationOverdue;
/**
 * Scheduled/automated overdue sweep (spec section 18). Finds every donation
 * still "due" whose dueDate has passed and flips it to "overdue", notifying
 * the tutor. Designed to be safely re-run on a schedule (e.g. a Render Cron
 * Job — see backend/src/jobs/processOverdueDonations.ts): the query only
 * ever matches donations still in "due", so re-running it after it has
 * already processed a donation is a no-op for that donation (idempotent).
 */
const processOverdueDonations = async () => {
    const overdueCandidates = await donation_model_1.Donation.find({ status: "due", dueDate: { $lt: new Date() } }).select("_id");
    let processed = 0;
    for (const candidate of overdueCandidates) {
        try {
            // Re-check status inside the loop via markDonationOverdue's own guard
            // so a candidate that changed state between the query above and now
            // (e.g. the tutor paid seconds ago) is safely skipped rather than
            // forced into "overdue".
            await (0, exports.markDonationOverdue)(candidate._id.toString());
            processed += 1;
        }
        catch (error) {
            if (!(error instanceof ApiError_1.ApiError && error.statusCode === 400)) {
                // eslint-disable-next-line no-console
                console.error("⚠️  Failed to process overdue donation", candidate._id.toString(), error);
            }
        }
    }
    return { processed };
};
exports.processOverdueDonations = processOverdueDonations;
const remindDonation = async (donationId) => {
    const donation = await donation_model_1.Donation.findById(donationId).populate({ path: "tutor", populate: { path: "user", select: "_id fullName" } });
    if (!donation)
        throw ApiError_1.ApiError.notFound("Donation not found");
    const tutor = donation.tutor;
    if (tutor?.user?._id) {
        await (0, notification_service_1.notify)({
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
exports.remindDonation = remindDonation;
const suspendDonationTutor = async (donationId, adminId) => {
    const donation = await donation_model_1.Donation.findById(donationId);
    if (!donation)
        throw ApiError_1.ApiError.notFound("Donation not found");
    const tutor = await tutorProfile_model_1.TutorProfile.findById(donation.tutor);
    if (!tutor)
        throw ApiError_1.ApiError.notFound("Tutor not found");
    const user = await user_model_1.User.findById(tutor.user);
    if (!user)
        throw ApiError_1.ApiError.notFound("Tutor account not found");
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
    await (0, notification_service_1.notify)({
        recipient: user._id,
        type: "system",
        message: "Your account has been suspended due to an unpaid donation obligation. Please contact Progoti Shikkha support.",
    });
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: "TUTOR_SUSPENDED",
        targetType: "TutorProfile",
        targetId: tutor._id,
        metadata: { donationId: donation._id },
    });
    return donation;
};
exports.suspendDonationTutor = suspendDonationTutor;
/**
 * Reverses a donation-related suspension (spec section 19: "must be
 * reversible by an authorized admin"). Restores login access and, if the
 * tutor was previously verified, restores marketplace visibility. Does not
 * silently forgive the underlying donation — that must still be handled via
 * verifyDonationPayment / markDonationSalaryReceived so the money owed is
 * accounted for, not swept away by a reinstatement.
 */
const reinstateTutor = async (donationId, adminId) => {
    const donation = await donation_model_1.Donation.findById(donationId);
    if (!donation)
        throw ApiError_1.ApiError.notFound("Donation not found");
    if (donation.status !== "suspended")
        throw ApiError_1.ApiError.badRequest("Only a suspended donation can be reinstated");
    const tutor = await tutorProfile_model_1.TutorProfile.findById(donation.tutor);
    if (!tutor)
        throw ApiError_1.ApiError.notFound("Tutor not found");
    const user = await user_model_1.User.findById(tutor.user);
    if (!user)
        throw ApiError_1.ApiError.notFound("Tutor account not found");
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
    await (0, notification_service_1.notify)({
        recipient: user._id,
        type: "system",
        message: "Your account has been reinstated. Your donation payment is still due — please submit it as soon as possible.",
        link: "/tutor/donations",
        relatedId: donation._id,
    });
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: "TUTOR_REINSTATED",
        targetType: "TutorProfile",
        targetId: tutor._id,
        metadata: { donationId: donation._id },
    });
    return donation;
};
exports.reinstateTutor = reinstateTutor;
const getAnalyticsSummary = async () => {
    const [studentCount, tutorCount, openPostsCount, filledPostsCount, pendingApprovals, pendingStudentVerifications, pendingTutorVerifications, donationDue, donationPaymentSubmitted, donationCompleted, donationOverdue] = await Promise.all([
        studentProfile_model_1.StudentProfile.countDocuments(),
        tutorProfile_model_1.TutorProfile.countDocuments(),
        tuitionPost_model_1.TuitionPost.countDocuments({ status: "open" }),
        tuitionPost_model_1.TuitionPost.countDocuments({ status: "filled" }),
        tutorProfile_model_1.TutorProfile.countDocuments({ isApproved: false }),
        studentProfile_model_1.StudentProfile.countDocuments({ $or: [{ verificationStatus: "pending" }, { verificationStatus: { $exists: false } }] }),
        tutorProfile_model_1.TutorProfile.countDocuments({ $or: [{ verificationStatus: "pending" }, { verificationStatus: { $exists: false } }] }),
        donation_model_1.Donation.countDocuments({ status: "due" }),
        donation_model_1.Donation.countDocuments({ status: "payment_submitted" }),
        donation_model_1.Donation.countDocuments({ status: "completed" }),
        donation_model_1.Donation.countDocuments({ status: "overdue" }),
    ]);
    return {
        studentCount, tutorCount, openPostsCount, filledPostsCount, pendingApprovals,
        pendingStudentVerifications, pendingTutorVerifications, donationDue, donationPaymentSubmitted, donationCompleted, donationOverdue,
    };
};
exports.getAnalyticsSummary = getAnalyticsSummary;
const broadcastNotification = async (input) => {
    const roleFilter = input.audience === "all" ? {} : { role: input.audience === "students" ? "student" : "tutor" };
    const recipients = await user_model_1.User.find({ ...roleFilter, isVerified: true }).select("_id");
    await Promise.all(recipients.map((recipient) => (0, notification_service_1.notify)({ recipient: recipient._id, type: "system", message: input.message })));
    return { recipientCount: recipients.length };
};
exports.broadcastNotification = broadcastNotification;
const toggleSuspendUser = async (userId, adminId) => {
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw ApiError_1.ApiError.notFound("User not found");
    user.isSuspended = !user.isSuspended;
    if (user.isSuspended)
        user.refreshSessions = [];
    await user.save();
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: user.isSuspended ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
        targetType: "User",
        targetId: user._id,
    });
    return user;
};
exports.toggleSuspendUser = toggleSuspendUser;
const deleteUser = async (userId, adminId) => {
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw ApiError_1.ApiError.notFound("User not found");
    if (user.role === "student") {
        const profile = await studentProfile_model_1.StudentProfile.findOne({ user: user._id });
        if (profile) {
            const posts = await tuitionPost_model_1.TuitionPost.find({ student: profile._id }).select("_id");
            await application_model_1.Application.deleteMany({ tuitionPost: { $in: posts.map((p) => p._id) } });
            await donation_model_1.Donation.deleteMany({ tuitionPost: { $in: posts.map((p) => p._id) } });
            await tuitionPost_model_1.TuitionPost.deleteMany({ student: profile._id });
            await profile.deleteOne();
        }
    }
    else if (user.role === "tutor") {
        const profile = await tutorProfile_model_1.TutorProfile.findOne({ user: user._id });
        if (profile) {
            const applications = await application_model_1.Application.find({ tutor: profile._id }).select("_id");
            await donation_model_1.Donation.deleteMany({ application: { $in: applications.map((a) => a._id) } });
            await application_model_1.Application.deleteMany({ tutor: profile._id });
            await profile.deleteOne();
        }
    }
    const deletedId = user._id;
    const deletedRole = user.role;
    await user.deleteOne();
    await (0, auditLog_service_1.logAction)({
        actor: adminId,
        action: "USER_DELETED",
        targetType: "User",
        targetId: deletedId,
        metadata: { role: deletedRole },
    });
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=admin.service.js.map