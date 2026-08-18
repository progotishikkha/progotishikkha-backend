import { Router } from "express";
import authRoutes from "./auth.routes";
import tuitionPostRoutes from "./tuitionPost.routes";
import applicationRoutes from "./application.routes";
import notificationRoutes from "./notification.routes";
import blogRoutes from "./blog.routes";
import reviewRoutes from "./review.routes";
import contactRoutes from "./contact.routes";
import categoryRoutes from "./category.routes";
import tutorRoutes from "./tutor.routes";
import studentRoutes from "./student.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tuition-posts", tuitionPostRoutes);
router.use("/applications", applicationRoutes);
router.use("/notifications", notificationRoutes);
router.use("/blogs", blogRoutes);
router.use("/reviews", reviewRoutes);
router.use("/contact", contactRoutes);
router.use("/categories", categoryRoutes);
router.use("/tutors", tutorRoutes);
router.use("/students", studentRoutes);
router.use("/admin", adminRoutes);

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Progoti Shikkha API is healthy",
    timestamp: new Date().toISOString(),
  });
});

export default router;
