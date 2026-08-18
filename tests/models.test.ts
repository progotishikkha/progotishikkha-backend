import mongoose from "mongoose";
import { TuitionPost } from "../src/models/tuitionPost.model";
import { Application } from "../src/models/application.model";
import { Review } from "../src/models/review.model";
import { Blog } from "../src/models/blog.model";
import { Comment } from "../src/models/comment.model";
import { Category } from "../src/models/category.model";
import { Notification } from "../src/models/notification.model";
import { ContactMessage } from "../src/models/contactMessage.model";
import { TutorProfile } from "../src/models/tutorProfile.model";
import { StudentProfile } from "../src/models/studentProfile.model";
import { SavedTuition } from "../src/models/savedTuition.model";
import { User } from "../src/models/user.model";
import { Otp } from "../src/models/otp.model";

const id = () => new mongoose.Types.ObjectId();

describe("User model", () => {
  it("requires fullName, email, phone, passwordHash, role", () => {
    const err = new User({}).validateSync();
    expect(err).not.toBeNull();
  });

  it("rejects an invalid role", () => {
    const err = new User({
      fullName: "Test User",
      email: "test@example.com",
      phone: "+8801700000000",
      passwordHash: "hashed",
      role: "wizard",
    }).validateSync();
    expect(err?.errors.role).toBeDefined();
  });

  it("accepts a valid student user", () => {
    const err = new User({
      fullName: "Test User",
      email: "test@example.com",
      phone: "+8801700000000",
      passwordHash: "hashed",
      role: "student",
    }).validateSync();
    expect(err).toBeUndefined();
  });
});

describe("TuitionPost model", () => {
  it("requires all core fields", () => {
    const err = new TuitionPost({}).validateSync();
    expect(err).not.toBeNull();
  });

  it("rejects an invalid teachingMode", () => {
    const err = new TuitionPost({
      student: id(),
      title: "x",
      class: "8",
      medium: "Bangla",
      subject: "Math",
      daysPerWeek: 3,
      salary: 1000,
      location: "Dhaka",
      teachingMode: "telepathy",
      description: "desc",
      deadline: new Date(),
    }).validateSync();
    expect(err?.errors.teachingMode).toBeDefined();
  });

  it("accepts a fully valid post", () => {
    const err = new TuitionPost({
      student: id(),
      title: "Need Math tutor",
      class: "Class 8",
      medium: "Bangla",
      subject: "Mathematics",
      daysPerWeek: 3,
      salary: 5000,
      location: "Dhaka",
      teachingMode: "offline",
      description: "Looking for an experienced tutor.",
      deadline: new Date(),
    }).validateSync();
    expect(err).toBeUndefined();
  });
});

describe("Application model", () => {
  it("requires tuitionPost, tutor, coverMessage, expectedSalary, availability", () => {
    const err = new Application({}).validateSync();
    expect(err).not.toBeNull();
  });

  it("accepts a valid application", () => {
    const err = new Application({
      tuitionPost: id(),
      tutor: id(),
      coverMessage: "I'd love to help with this tuition.",
      expectedSalary: 5000,
      availability: "Evenings",
    }).validateSync();
    expect(err).toBeUndefined();
  });
});

describe("Review model", () => {
  it("rejects a rating above 5", () => {
    const err = new Review({ tutor: id(), student: id(), tuitionPost: id(), rating: 6 }).validateSync();
    expect(err?.errors.rating).toBeDefined();
  });

  it("rejects a rating below 1", () => {
    const err = new Review({ tutor: id(), student: id(), tuitionPost: id(), rating: 0 }).validateSync();
    expect(err?.errors.rating).toBeDefined();
  });

  it("accepts a valid rating", () => {
    const err = new Review({ tutor: id(), student: id(), tuitionPost: id(), rating: 5 }).validateSync();
    expect(err).toBeUndefined();
  });
});

describe("Blog model", () => {
  it("requires a slug", () => {
    const err = new Blog({ title: "No slug", content: "content", category: id(), author: id() }).validateSync();
    expect(err?.errors.slug).toBeDefined();
  });

  it("accepts a valid published blog", () => {
    const err = new Blog({
      title: "5 Tips",
      slug: "5-tips",
      content: "Full content",
      category: id(),
      author: id(),
      status: "published",
    }).validateSync();
    expect(err).toBeUndefined();
  });
});

describe("Comment model", () => {
  it("accepts a valid comment", () => {
    const err = new Comment({ blog: id(), user: id(), content: "Great post!" }).validateSync();
    expect(err).toBeUndefined();
  });
});

describe("Category model", () => {
  it("accepts a valid category", () => {
    const err = new Category({ name: "Study Tips", slug: "study-tips" }).validateSync();
    expect(err).toBeUndefined();
  });
});

describe("Notification model", () => {
  it("rejects an invalid type", () => {
    const err = new Notification({ recipient: id(), type: "carrier_pigeon", message: "test" }).validateSync();
    expect(err?.errors.type).toBeDefined();
  });

  it("accepts a valid notification", () => {
    const err = new Notification({
      recipient: id(),
      type: "new_application",
      message: "A tutor applied to your post",
    }).validateSync();
    expect(err).toBeUndefined();
  });
});

describe("ContactMessage model", () => {
  it("accepts a valid message", () => {
    const err = new ContactMessage({
      name: "Rafi",
      email: "rafi@example.com",
      subject: "Question",
      message: "How do I hire a tutor?",
    }).validateSync();
    expect(err).toBeUndefined();
  });
});

describe("TutorProfile model", () => {
  it("rejects a rating out of bounds", () => {
    const err = new TutorProfile({ user: id(), rating: 10 }).validateSync();
    expect(err?.errors.rating).toBeDefined();
  });

  it("accepts a valid expanded profile", () => {
    const err = new TutorProfile({
      user: id(),
      qualification: "BSc Mathematics",
      subjects: ["Math", "Physics"],
      availability: "evenings",
      rating: 4.5,
    }).validateSync();
    expect(err).toBeUndefined();
  });
});

describe("StudentProfile model", () => {
  it("accepts a valid profile", () => {
    const err = new StudentProfile({ user: id(), location: "Dhanmondi" }).validateSync();
    expect(err).toBeUndefined();
  });
});

describe("SavedTuition model", () => {
  it("requires tutor and tuitionPost", () => {
    const err = new SavedTuition({}).validateSync();
    expect(err).not.toBeNull();
  });

  it("accepts a valid saved tuition", () => {
    const err = new SavedTuition({ tutor: id(), tuitionPost: id() }).validateSync();
    expect(err).toBeUndefined();
  });
});

describe("Otp model", () => {
  it("rejects an invalid purpose", () => {
    const err = new Otp({
      user: id(),
      codeHash: "hash",
      purpose: "unlock_treasure",
      expiresAt: new Date(),
    }).validateSync();
    expect(err?.errors.purpose).toBeDefined();
  });

  it("accepts a valid OTP document", () => {
    const err = new Otp({
      user: id(),
      codeHash: "hash",
      purpose: "verify_email",
      expiresAt: new Date(Date.now() + 600000),
    }).validateSync();
    expect(err).toBeUndefined();
  });
});
