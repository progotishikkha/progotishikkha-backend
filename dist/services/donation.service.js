"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDonation = exports.submitPayment = exports.getPaymentInstructions = exports.listMyDonations = exports.calculateDonationAmount = exports.DONATION_PERCENTAGE = void 0;
const donation_model_1 = require("../models/donation.model");
const tutorProfile_model_1 = require("../models/tutorProfile.model");
const ApiError_1 = require("../utils/ApiError");
const env_1 = require("../config/env");
const notification_service_1 = require("./notification.service");
// Business rule (spec section 13): the donation is a FIXED 10% of the first
// month's salary. This is intentionally a hardcoded constant rather than
// env.DONATION_PERCENTAGE — a configurable percentage set via environment
// variable could previously be changed without a corresponding product
// decision, and nothing about this value should ever be influenced by
// client input. If the business genuinely changes the percentage, change
// this constant (and redeploy), not an environment variable a non-engineer
// could edit.
exports.DONATION_PERCENTAGE = 10;
const calculateDonationAmount = (salary, percentage = exports.DONATION_PERCENTAGE) => Math.round((salary * percentage) / 100);
exports.calculateDonationAmount = calculateDonationAmount;
const listMyDonations = async (userId) => {
    const tutor = await tutorProfile_model_1.TutorProfile.findOne({ user: userId }).select("_id");
    if (!tutor)
        throw ApiError_1.ApiError.notFound("Tutor profile not found");
    return donation_model_1.Donation.find({ tutor: tutor._id })
        .populate("tuitionPost", "title salary location status")
        .sort({ createdAt: -1 });
};
exports.listMyDonations = listMyDonations;
const getPaymentInstructions = () => ({
    paymentMethod: "bkash",
    accountNumber: env_1.env.DONATION_BKASH_NUMBER,
    percentage: exports.DONATION_PERCENTAGE,
});
exports.getPaymentInstructions = getPaymentInstructions;
const submitPayment = async (userId, donationId, input) => {
    const tutor = await tutorProfile_model_1.TutorProfile.findOne({ user: userId }).select("_id");
    if (!tutor)
        throw ApiError_1.ApiError.notFound("Tutor profile not found");
    const donation = await donation_model_1.Donation.findOne({ _id: donationId, tutor: tutor._id });
    if (!donation)
        throw ApiError_1.ApiError.notFound("Donation not found");
    if (!["due", "overdue", "rejected"].includes(donation.status)) {
        throw ApiError_1.ApiError.badRequest("This donation is not currently payable");
    }
    donation.transactionId = input.transactionId;
    donation.paymentMethod = "bkash";
    donation.paymentSubmittedAt = new Date();
    donation.status = "payment_submitted";
    await donation.save();
    await (0, notification_service_1.notify)({
        recipient: userId,
        type: "system",
        message: `Your donation payment of ৳${donation.donationAmount.toLocaleString()} has been submitted for admin verification.`,
        link: "/tutor/donations",
        relatedId: donation._id,
    });
    return donation;
};
exports.submitPayment = submitPayment;
const getDonation = async (userId, donationId) => {
    const tutor = await tutorProfile_model_1.TutorProfile.findOne({ user: userId }).select("_id");
    if (!tutor)
        throw ApiError_1.ApiError.notFound("Tutor profile not found");
    const donation = await donation_model_1.Donation.findOne({ _id: donationId, tutor: tutor._id }).populate("tuitionPost", "title salary location status");
    if (!donation)
        throw ApiError_1.ApiError.notFound("Donation not found");
    return donation;
};
exports.getDonation = getDonation;
//# sourceMappingURL=donation.service.js.map