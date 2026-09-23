"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSavedTuitions = exports.unsaveTuition = exports.saveTuition = exports.rejectApplicant = exports.hireApplicant = exports.listApplicationsForPost = exports.listMyApplications = exports.applyToTuition = void 0;
const application_model_1 = require("../models/application.model");
const tuitionPost_model_1 = require("../models/tuitionPost.model");
const tutorProfile_model_1 = require("../models/tutorProfile.model");
const savedTuition_model_1 = require("../models/savedTuition.model");
const donation_model_1 = require("../models/donation.model");
const user_model_1 = require("../models/user.model");
const donation_service_1 = require("./donation.service");
const studentProfile_model_1 = require("../models/studentProfile.model");
const ApiError_1 = require("../utils/ApiError");
const resolveProfile_1 = require("../utils/resolveProfile");
const notification_service_1 = require("./notification.service");
const auditLog_service_1 = require("./auditLog.service");
const applyToTuition = async (userId, input) => {
    const tutorId = await (0, resolveProfile_1.getTutorProfileIdOrThrow)(userId);
    const tutorProfile = await tutorProfile_model_1.TutorProfile.findById(tutorId);
    if (!tutorProfile) {
        throw ApiError_1.ApiError.notFound("Tutor profile not found");
    }
    // Tutors may apply before admin verification. Rejected profiles remain
    // blocked; verification can still be completed later by an admin.
    if (tutorProfile.verificationStatus === "rejected") {
        throw ApiError_1.ApiError.forbidden("Your tutor profile has been rejected. Please update your profile and contact admin before applying.");
    }
    const post = await tuitionPost_model_1.TuitionPost.findById(input.tuitionPostId);
    if (!post)
        throw ApiError_1.ApiError.notFound("Tuition post not found");
    if (post.status !== "open")
        throw ApiError_1.ApiError.badRequest("This tuition post is no longer accepting applications");
    const application = await application_model_1.Application.create({
        tuitionPost: post._id,
        tutor: tutorId,
        coverMessage: input.coverMessage,
        expectedSalary: input.expectedSalary,
        availability: input.availability,
        connectionStatus: "not_connected",
    });
    // Notify the student who owns the post.
    const studentProfile = await studentProfile_model_1.StudentProfile.findById(post.student);
    if (studentProfile) {
        await (0, notification_service_1.notify)({
            recipient: studentProfile.user,
            type: "new_application",
            message: `A tutor applied to your post: ${post.title}`,
            link: `/student/posts/${post._id}/applicants`,
            relatedId: application._id,
        });
    }
    return application;
};
exports.applyToTuition = applyToTuition;
const listMyApplications = async (userId) => {
    const tutorId = await (0, resolveProfile_1.getTutorProfileIdOrThrow)(userId);
    return application_model_1.Application.find({ tutor: tutorId })
        .populate("tuitionPost", "title salary location status")
        .sort({ createdAt: -1 });
};
exports.listMyApplications = listMyApplications;
const listApplicationsForPost = async (postId, userId) => {
    const studentId = await (0, resolveProfile_1.getStudentProfileIdOrThrow)(userId);
    const post = await tuitionPost_model_1.TuitionPost.findById(postId);
    if (!post)
        throw ApiError_1.ApiError.notFound("Tuition post not found");
    if (post.student.toString() !== studentId.toString()) {
        throw ApiError_1.ApiError.forbidden("You do not own this tuition post");
    }
    return application_model_1.Application.find({ tuitionPost: postId })
        .populate({
        path: "tutor",
        select: "-whatsappNumber -verificationNote -verifiedBy -verificationRequestedAt -verifiedAt",
        populate: { path: "user", select: "fullName" },
    })
        .sort({ createdAt: -1 });
};
exports.listApplicationsForPost = listApplicationsForPost;
const assertStudentOwnsApplicationPost = async (applicationId, userId) => {
    const studentId = await (0, resolveProfile_1.getStudentProfileIdOrThrow)(userId);
    const application = await application_model_1.Application.findById(applicationId).populate("tuitionPost");
    if (!application)
        throw ApiError_1.ApiError.notFound("Application not found");
    const post = await tuitionPost_model_1.TuitionPost.findById(application.tuitionPost);
    if (!post || post.student.toString() !== studentId.toString()) {
        throw ApiError_1.ApiError.forbidden("You do not own this tuition post");
    }
    return { application, post };
};
const hireApplicant = async (applicationId, userId) => {
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
    const tutorProfileCheck = await tutorProfile_model_1.TutorProfile.findById(application.tutor).select("isApproved verificationStatus");
    if (!tutorProfileCheck || tutorProfileCheck.verificationStatus === "rejected") {
        throw ApiError_1.ApiError.badRequest("This tutor is no longer eligible to be hired");
    }
    const claimedPost = await tuitionPost_model_1.TuitionPost.findOneAndUpdate({ _id: post._id, status: "open" }, { status: "filled", hiredTutor: application.tutor }, { new: true });
    if (!claimedPost) {
        throw ApiError_1.ApiError.conflict("This tuition post already has a hired tutor");
    }
    const claimedApplication = await application_model_1.Application.findOneAndUpdate({ _id: application._id, status: "pending" }, { status: "hired", connectionStatus: "pending_admin" }, { new: true });
    if (!claimedApplication) {
        // Compensate: the post claim above succeeded but this specific
        // application had already moved out of "pending" (e.g. rejected or
        // hired concurrently by another request) — release the post back to
        // "open" so it isn't stuck "filled" with no hired application.
        await tuitionPost_model_1.TuitionPost.findOneAndUpdate({ _id: post._id, status: "filled", hiredTutor: application.tutor }, { status: "open", $unset: { hiredTutor: "" } });
        throw ApiError_1.ApiError.conflict("This application can no longer be hired");
    }
    // Keep the existing hire flow intact while creating the first-month donation
    // record. Donation amount is calculated server-side and locked to the
    // platform's fixed percentage — never trusted from client input.
    await donation_model_1.Donation.findOneAndUpdate({ application: claimedApplication._id }, {
        application: claimedApplication._id,
        tutor: claimedApplication.tutor,
        tuitionPost: claimedPost._id,
        firstMonthSalary: claimedPost.salary,
        percentage: donation_service_1.DONATION_PERCENTAGE,
        donationAmount: (0, donation_service_1.calculateDonationAmount)(claimedPost.salary),
        status: "not_due",
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    // Reject all other pending applications for this post.
    await application_model_1.Application.updateMany({ tuitionPost: claimedPost._id, _id: { $ne: claimedApplication._id }, status: "pending" }, { status: "rejected" });
    // NOTE: completedTuitionCount intentionally is NOT incremented here.
    // Being hired is not the same as completing a tuition (spec section 21).
    // It is incremented once the admin confirms the first month's salary was
    // actually received — see admin.service.markDonationSalaryReceived.
    const tutorProfile = await tutorProfile_model_1.TutorProfile.findById(claimedApplication.tutor);
    if (tutorProfile) {
        await (0, notification_service_1.notify)({
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
    const admins = await user_model_1.User.find({ role: "admin" }).select("_id");
    await Promise.all(admins.map((admin) => (0, notification_service_1.notify)({
        recipient: admin._id,
        type: "hire_request",
        message: `A student hired a tutor for "${claimedPost.title}". Awaiting admin mediation.`,
        link: `/admin/posts`,
        relatedId: claimedApplication._id,
    })));
    await (0, auditLog_service_1.logAction)({
        actor: userId,
        action: "APPLICATION_HIRED",
        targetType: "Application",
        targetId: claimedApplication._id,
        metadata: { tuitionPost: claimedPost._id, tutor: claimedApplication.tutor },
    });
    return claimedApplication;
};
exports.hireApplicant = hireApplicant;
const rejectApplicant = async (applicationId, userId) => {
    const { application, post } = await assertStudentOwnsApplicationPost(applicationId, userId);
    // Only a still-pending application can be rejected — an already
    // hired/rejected application shouldn't silently change state again.
    const updated = await application_model_1.Application.findOneAndUpdate({ _id: application._id, status: "pending" }, { status: "rejected" }, { new: true });
    if (!updated) {
        throw ApiError_1.ApiError.conflict("This application has already been decided");
    }
    const tutorProfile = await tutorProfile_model_1.TutorProfile.findById(updated.tutor);
    if (tutorProfile) {
        await (0, notification_service_1.notify)({
            recipient: tutorProfile.user,
            type: "tutor_rejected",
            message: `Your application for "${post.title}" was not selected this time.`,
            relatedId: post._id,
        });
    }
    await (0, auditLog_service_1.logAction)({
        actor: userId,
        action: "APPLICATION_REJECTED",
        targetType: "Application",
        targetId: updated._id,
        metadata: { tuitionPost: post._id },
    });
    return updated;
};
exports.rejectApplicant = rejectApplicant;
const saveTuition = async (userId, tuitionPostId) => {
    const tutorId = await (0, resolveProfile_1.getTutorProfileIdOrThrow)(userId);
    const post = await tuitionPost_model_1.TuitionPost.findById(tuitionPostId);
    if (!post)
        throw ApiError_1.ApiError.notFound("Tuition post not found");
    await savedTuition_model_1.SavedTuition.findOneAndUpdate({ tutor: tutorId, tuitionPost: tuitionPostId }, { tutor: tutorId, tuitionPost: tuitionPostId }, { upsert: true });
};
exports.saveTuition = saveTuition;
const unsaveTuition = async (userId, tuitionPostId) => {
    const tutorId = await (0, resolveProfile_1.getTutorProfileIdOrThrow)(userId);
    await savedTuition_model_1.SavedTuition.deleteOne({ tutor: tutorId, tuitionPost: tuitionPostId });
};
exports.unsaveTuition = unsaveTuition;
const listSavedTuitions = async (userId) => {
    const tutorId = await (0, resolveProfile_1.getTutorProfileIdOrThrow)(userId);
    const saved = await savedTuition_model_1.SavedTuition.find({ tutor: tutorId }).populate("tuitionPost");
    return saved.map((s) => s.tuitionPost);
};
exports.listSavedTuitions = listSavedTuitions;
//# sourceMappingURL=application.service.js.map