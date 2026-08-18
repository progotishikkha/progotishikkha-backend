import { slugify } from "../src/utils/slugify";
import { sha256 } from "../src/utils/hash";
import { generateOtpCode } from "../src/utils/generateOtp";
import { expiresInToDate } from "../src/services/token.service";
import { hashPassword, comparePassword } from "../src/utils/password";

describe("slugify", () => {
  it("converts spaces and casing to a URL-safe slug", () => {
    expect(slugify("5 Tips for Effective Studying")).toBe("5-tips-for-effective-studying");
  });

  it("strips special characters", () => {
    expect(slugify("Math & Physics: Class 9!")).toBe("math-physics-class-9");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world");
  });
});

describe("sha256", () => {
  it("is deterministic", () => {
    expect(sha256("test")).toBe(sha256("test"));
  });

  it("produces different hashes for different input", () => {
    expect(sha256("test")).not.toBe(sha256("test2"));
  });

  it("produces a 64-character hex digest", () => {
    expect(sha256("test")).toHaveLength(64);
  });
});

describe("generateOtpCode", () => {
  it("generates a 6-digit numeric code", () => {
    const otp = generateOtpCode();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("stays within the valid 6-digit range", () => {
    const otp = Number(generateOtpCode());
    expect(otp).toBeGreaterThanOrEqual(100000);
    expect(otp).toBeLessThanOrEqual(999999);
  });
});

describe("expiresInToDate", () => {
  it("resolves '15m' to ~15 minutes from now", () => {
    const future = expiresInToDate("15m");
    const diffMinutes = Math.round((future.getTime() - Date.now()) / 60000);
    expect(diffMinutes).toBe(15);
  });

  it("resolves '7d' to ~7 days from now", () => {
    const future = expiresInToDate("7d");
    const diffDays = Math.round((future.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    expect(diffDays).toBe(7);
  });
});

describe("password hashing", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("MySecurePass123");
    expect(await comparePassword("MySecurePass123", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("MySecurePass123");
    expect(await comparePassword("WrongPassword", hash)).toBe(false);
  });

  it("never stores the password in plain text", async () => {
    const hash = await hashPassword("MySecurePass123");
    expect(hash).not.toBe("MySecurePass123");
  });
});
