import { hashPassword } from "../src/utils/password";
import { loginUser } from "../src/services/auth.service";

// Mock the User model to simulate exactly what a real Mongoose query returns
// when `refreshSessions` (select: false) isn't explicitly re-included —
// this is the scenario that caused "Cannot read properties of undefined
// (reading 'push')" in production.
jest.mock("../src/models/user.model", () => ({
  User: { findOne: jest.fn() },
}));

jest.mock("../src/models/studentProfile.model", () => ({
  StudentProfile: { findOneAndUpdate: jest.fn().mockResolvedValue({}) },
}));
jest.mock("../src/models/tutorProfile.model", () => ({
  TutorProfile: { findOneAndUpdate: jest.fn().mockResolvedValue({}) },
}));
jest.mock("../src/services/otp.service", () => ({
  verifyOtp: jest.fn().mockResolvedValue(undefined),
  issueOtp: jest.fn(),
}));

import { User } from "../src/models/user.model";

function makeFakeUserDoc(overrides: Record<string, unknown> = {}) {
  // Deliberately omit `refreshSessions` to reproduce the exact select:false
  // scenario — a real Mongoose doc would have it as `undefined` here too.
  const doc: Record<string, unknown> = {
    _id: { toString: () => "507f1f77bcf86cd799439011" },
    fullName: "Test User",
    email: "test@example.com",
    role: "student",
    isVerified: true,
    isActive: true,
    isSuspended: false,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return doc;
}

describe("createSession refreshSessions regression (undefined.push bug)", () => {
  it("loginUser succeeds even when the fetched user doc has no refreshSessions field", async () => {
    const passwordHash = await hashPassword("CorrectPass123");
    const fakeUser = makeFakeUserDoc({ passwordHash });

    (User.findOne as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUser),
    });

    const result = await loginUser(
      { email: "test@example.com", password: "CorrectPass123" },
      { userAgent: "jest", ip: "127.0.0.1" }
    );

    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    // The defensive guard in createSession should have initialized the array.
    expect(Array.isArray(fakeUser.refreshSessions)).toBe(true);
    expect((fakeUser.refreshSessions as unknown[]).length).toBe(1);
    expect(fakeUser.save).toHaveBeenCalled();
  });


});
