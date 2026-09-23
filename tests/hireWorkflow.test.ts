import mongoose from "mongoose";

const studentId = new mongoose.Types.ObjectId();
const postId = new mongoose.Types.ObjectId();
const applicationId = new mongoose.Types.ObjectId();
const tutorProfileId = new mongoose.Types.ObjectId();

// A tiny stand-in for a Mongoose Query: awaiting it directly resolves to
// `value` (queries are thenables), and calling .select()/.populate() on it
// keeps returning something that resolves to `value` too. This lets the
// same mock satisfy both `await Model.findById(x)` and
// `await Model.findById(x).select("...")` call sites without having to
// know in advance which chain a given test exercises.
const queryMock = (value: unknown) => {
  const q: any = Promise.resolve(value);
  q.select = jest.fn().mockReturnValue(queryMock(value));
  q.populate = jest.fn().mockReturnValue(queryMock(value));
  return q;
};

jest.mock("../src/models/studentProfile.model", () => ({
  StudentProfile: { findOne: jest.fn(), findById: jest.fn() },
}));
jest.mock("../src/models/tutorProfile.model", () => ({
  TutorProfile: { findById: jest.fn(), findByIdAndUpdate: jest.fn() },
}));
jest.mock("../src/models/tuitionPost.model", () => ({
  TuitionPost: { findById: jest.fn(), findOneAndUpdate: jest.fn() },
}));
jest.mock("../src/models/application.model", () => ({
  Application: { findById: jest.fn(), findOneAndUpdate: jest.fn(), updateMany: jest.fn() },
}));
jest.mock("../src/models/donation.model", () => ({
  Donation: { findOneAndUpdate: jest.fn() },
}));
jest.mock("../src/models/user.model", () => ({
  User: { find: jest.fn() },
}));
jest.mock("../src/models/savedTuition.model", () => ({
  SavedTuition: { findOneAndUpdate: jest.fn(), deleteOne: jest.fn(), find: jest.fn() },
}));
jest.mock("../src/services/notification.service", () => ({ notify: jest.fn() }));
jest.mock("../src/services/auditLog.service", () => ({ logAction: jest.fn() }));

import { StudentProfile } from "../src/models/studentProfile.model";
import { TutorProfile } from "../src/models/tutorProfile.model";
import { TuitionPost } from "../src/models/tuitionPost.model";
import { Application } from "../src/models/application.model";
import { Donation } from "../src/models/donation.model";
import { User } from "../src/models/user.model";
import { hireApplicant, rejectApplicant } from "../src/services/application.service";
import { ApiError } from "../src/utils/ApiError";

const basePost = { _id: postId, student: studentId, salary: 10000, status: "open", title: "Class 9 Physics", save: jest.fn() };
const baseApplication = { _id: applicationId, tuitionPost: postId, tutor: tutorProfileId, status: "pending" };

beforeEach(() => {
  jest.clearAllMocks();
  (StudentProfile.findOne as jest.Mock).mockReturnValue(queryMock({ _id: studentId }));
  (Application.findById as jest.Mock).mockReturnValue(queryMock(baseApplication));
  (TuitionPost.findById as jest.Mock).mockReturnValue(queryMock(basePost));
  (TutorProfile.findById as jest.Mock).mockReturnValue(queryMock({ _id: tutorProfileId, isApproved: true, user: new mongoose.Types.ObjectId() }));
  (Donation.findOneAndUpdate as jest.Mock).mockResolvedValue({});
  (Application.updateMany as jest.Mock).mockResolvedValue({});
  (User.find as jest.Mock).mockReturnValue(queryMock([]));
});

describe("hireApplicant — atomic hire (spec sections 6 & 7)", () => {
  it("hires successfully when the post is open and the application is pending", async () => {
    (TuitionPost.findOneAndUpdate as jest.Mock).mockResolvedValueOnce({ ...basePost, status: "filled" });
    (Application.findOneAndUpdate as jest.Mock).mockResolvedValueOnce({
      ...baseApplication,
      status: "hired",
      connectionStatus: "pending_admin",
    });

    const result = await hireApplicant(applicationId.toString(), studentId.toString());

    expect(result.status).toBe("hired");
    expect(result.connectionStatus).toBe("pending_admin");
    // The post claim must be conditioned on status: "open" — this is what
    // makes the operation safe against a concurrent second hire attempt.
    expect(TuitionPost.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: postId, status: "open" }),
      expect.objectContaining({ status: "filled" }),
      expect.anything()
    );
    expect(Application.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: applicationId, status: "pending" }),
      expect.objectContaining({ status: "hired" }),
      expect.anything()
    );
  });

  it("rejects with 409 and does not create a donation if the post was already filled", async () => {
    (TuitionPost.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(null);

    await expect(hireApplicant(applicationId.toString(), studentId.toString())).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(Application.findOneAndUpdate).not.toHaveBeenCalled();
    expect(Donation.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("rolls back the claimed post if the application lost the race (already decided)", async () => {
    (TuitionPost.findOneAndUpdate as jest.Mock)
      .mockResolvedValueOnce({ ...basePost, status: "filled" }) // initial claim succeeds
      .mockResolvedValueOnce({ ...basePost, status: "open" }); // compensating rollback
    (Application.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(null); // lost the race

    await expect(hireApplicant(applicationId.toString(), studentId.toString())).rejects.toMatchObject({
      statusCode: 409,
    });

    // Compensating rollback must have been attempted.
    expect(TuitionPost.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(Donation.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("refuses to hire a tutor who is no longer approved", async () => {
    (TutorProfile.findById as jest.Mock).mockReturnValue(queryMock({ _id: tutorProfileId, isApproved: false }));

    await expect(hireApplicant(applicationId.toString(), studentId.toString())).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(TuitionPost.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("throws forbidden if the requesting student does not own the post", async () => {
    (TuitionPost.findById as jest.Mock).mockReturnValue(
      queryMock({ ...basePost, student: new mongoose.Types.ObjectId() })
    );

    await expect(hireApplicant(applicationId.toString(), studentId.toString())).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});

describe("rejectApplicant", () => {
  it("rejects a pending application", async () => {
    (Application.findOneAndUpdate as jest.Mock).mockResolvedValueOnce({ ...baseApplication, status: "rejected" });
    (TutorProfile.findById as jest.Mock).mockReturnValue(queryMock({ user: new mongoose.Types.ObjectId() }));

    const result = await rejectApplicant(applicationId.toString(), studentId.toString());
    expect(result.status).toBe("rejected");
  });

  it("throws 409 if the application was already decided", async () => {
    (Application.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(null);

    await expect(rejectApplicant(applicationId.toString(), studentId.toString())).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});

it("ApiError.conflict produces a 409", () => {
  expect(ApiError.conflict("x").statusCode).toBe(409);
});
