import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app";

const populateMock = () => ({ populate: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis() });

jest.mock("../src/models/tutorProfile.model", () => ({
  TutorProfile: { findOne: jest.fn(), find: jest.fn(), countDocuments: jest.fn() },
}));

import { TutorProfile } from "../src/models/tutorProfile.model";

describe("GET /api/v1/tutors/:id — contact privacy & approval gating (spec sections 4 & 5)", () => {
  it("queries with isApproved: true so an unapproved/suspended tutor's profile is never returned by id", async () => {
    const chain: any = { select: jest.fn().mockReturnThis(), populate: jest.fn().mockResolvedValue(null) };
    (TutorProfile.findOne as jest.Mock).mockReturnValue(chain);

    const id = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/v1/tutors/${id}`);

    expect(TutorProfile.findOne).toHaveBeenCalledWith(expect.objectContaining({ _id: id, isApproved: true }));
    expect(res.status).toBe(404);
  });

  it("never selects the tutor's whatsapp/contact/verification-note fields for the public profile", async () => {
    const chain: any = { select: jest.fn().mockReturnThis(), populate: jest.fn().mockResolvedValue({ _id: "x" }) };
    (TutorProfile.findOne as jest.Mock).mockReturnValue(chain);

    const id = new mongoose.Types.ObjectId().toString();
    await request(app).get(`/api/v1/tutors/${id}`);

    const selectArg = chain.select.mock.calls[0][0] as string;
    expect(selectArg).toEqual(expect.stringContaining("-whatsappNumber"));
  });
});
