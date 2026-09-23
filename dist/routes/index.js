"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const tuitionPost_routes_1 = __importDefault(require("./tuitionPost.routes"));
const application_routes_1 = __importDefault(require("./application.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const blog_routes_1 = __importDefault(require("./blog.routes"));
const review_routes_1 = __importDefault(require("./review.routes"));
const contact_routes_1 = __importDefault(require("./contact.routes"));
const category_routes_1 = __importDefault(require("./category.routes"));
const tutor_routes_1 = __importDefault(require("./tutor.routes"));
const student_routes_1 = __importDefault(require("./student.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const donation_routes_1 = __importDefault(require("./donation.routes"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/tuition-posts", tuitionPost_routes_1.default);
router.use("/applications", application_routes_1.default);
router.use("/notifications", notification_routes_1.default);
router.use("/blogs", blog_routes_1.default);
router.use("/reviews", review_routes_1.default);
router.use("/contact", contact_routes_1.default);
router.use("/categories", category_routes_1.default);
router.use("/tutors", tutor_routes_1.default);
router.use("/students", student_routes_1.default);
router.use("/admin", admin_routes_1.default);
router.use("/donations", donation_routes_1.default);
router.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Progoti Shikkha API is healthy",
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map