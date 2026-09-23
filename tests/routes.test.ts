import request from "supertest";
import app from "../src/app";

// Public-route reachability tests don't need real data — just confirm the
// auth middleware doesn't block them. Mocking the model layer keeps these
// fast and deterministic without requiring a live MongoDB connection.
jest.mock("../src/models/category.model", () => ({
  Category: { find: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([]) }) },
}));
jest.mock("../src/models/blog.model", () => ({
  Blog: {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
  },
}));

describe("Health check", () => {
  it("GET /api/v1/health returns 200", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Unknown routes", () => {
  it("returns 404 for a route that doesn't exist", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("Auth validation", () => {
  it("rejects registration with weak password, bad email, invalid role", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      fullName: "A",
      email: "not-an-email",
      phone: "123",
      password: "weak",
      confirmPassword: "different",
      role: "wizard",
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("email");
    expect(res.body.errors).toHaveProperty("password");
    expect(res.body.errors).toHaveProperty("role");
  });

  it("rejects login with missing fields", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({ email: "x" });
    expect(res.status).toBe(400);
  });
});

describe("Protected routes reject unauthenticated requests", () => {
  const cases: Array<[string, "get" | "post" | "patch" | "delete", string]> = [
    ["GET /auth/me", "get", "/api/v1/auth/me"],
    ["GET /tuition-posts/mine", "get", "/api/v1/tuition-posts/mine"],
    ["POST /tuition-posts", "post", "/api/v1/tuition-posts"],
    ["POST /applications", "post", "/api/v1/applications"],
    ["GET /admin/analytics", "get", "/api/v1/admin/analytics"],
    ["POST /categories", "post", "/api/v1/categories"],
    ["POST /reviews", "post", "/api/v1/reviews"],
    ["PATCH /auth/change-password", "patch", "/api/v1/auth/change-password"],
  ];

  it.each(cases)("%s returns 401 without a token", async (_label, method, path) => {
    const res = await request(app)[method](path).send({});
    expect(res.status).toBe(401);
  });

  it("rejects a malformed Bearer token", async () => {
    const res = await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer garbage");
    expect(res.status).toBe(401);
  });
});

describe("Public routes are reachable without auth (auth guard doesn't block them)", () => {
  it("GET /categories succeeds without a token", async () => {
    const res = await request(app).get("/api/v1/categories");
    expect(res.status).toBe(200);
  });

  it("GET /blogs succeeds without a token", async () => {
    const res = await request(app).get("/api/v1/blogs");
    expect(res.status).toBe(200);
  });
});

describe("Contact form validation", () => {
  it("rejects an incomplete submission", async () => {
    const res = await request(app).post("/api/v1/contact").send({ name: "A" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty("email");
    expect(res.body.errors).toHaveProperty("subject");
    expect(res.body.errors).toHaveProperty("message");
  });
});
