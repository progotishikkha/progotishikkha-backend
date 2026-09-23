import { Donation } from "../models/donation.model";
import { TutorProfile } from "../models/tutorProfile.model";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import { DonationPaymentInput } from "../validators/donation.validator";
import { notify } from "./notification.service";

// Business rule (spec section 13): the donation is a FIXED 10% of the first
// month's salary. This is intentionally a hardcoded constant rather than
// env.DONATION_PERCENTAGE — a configurable percentage set via environment
// variable could previously be changed without a corresponding product
// decision, and nothing about this value should ever be influenced by
// client input. If the business genuinely changes the percentage, change
// this constant (and redeploy), not an environment variable a non-engineer
// could edit.
export const DONATION_PERCENTAGE = 10;

export const calculateDonationAmount = (salary: number, percentage = DONATION_PERCENTAGE): number =>
  Math.round((salary * percentage) / 100);

export const listMyDonations = async (userId: string) => {
  const tutor = await TutorProfile.findOne({ user: userId }).select("_id");
  if (!tutor) throw ApiError.notFound("Tutor profile not found");
  return Donation.find({ tutor: tutor._id })
    .populate("tuitionPost", "title salary location status")
    .sort({ createdAt: -1 });
};

export const getPaymentInstructions = () => ({
  paymentMethod: "bkash",
  accountNumber: env.DONATION_BKASH_NUMBER,
  percentage: DONATION_PERCENTAGE,
});

export const submitPayment = async (userId: string, donationId: string, input: DonationPaymentInput) => {
  const tutor = await TutorProfile.findOne({ user: userId }).select("_id");
  if (!tutor) throw ApiError.notFound("Tutor profile not found");

  const donation = await Donation.findOne({ _id: donationId, tutor: tutor._id });
  if (!donation) throw ApiError.notFound("Donation not found");
  if (!["due", "overdue", "rejected"].includes(donation.status)) {
    throw ApiError.badRequest("This donation is not currently payable");
  }

  donation.transactionId = input.transactionId;
  donation.paymentMethod = "bkash";
  donation.paymentSubmittedAt = new Date();
  donation.status = "payment_submitted";
  await donation.save();

  await notify({
    recipient: userId,
    type: "system",
    message: `Your donation payment of ৳${donation.donationAmount.toLocaleString()} has been submitted for admin verification.`,
    link: "/tutor/donations",
    relatedId: donation._id,
  });

  return donation;
};

export const getDonation = async (userId: string, donationId: string) => {
  const tutor = await TutorProfile.findOne({ user: userId }).select("_id");
  if (!tutor) throw ApiError.notFound("Tutor profile not found");
  const donation = await Donation.findOne({ _id: donationId, tutor: tutor._id }).populate("tuitionPost", "title salary location status");
  if (!donation) throw ApiError.notFound("Donation not found");
  return donation;
};
