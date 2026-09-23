"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentSchema = exports.updateBlogSchema = exports.createBlogSchema = void 0;
const zod_1 = require("zod");
exports.createBlogSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(5).max(200),
    content: zod_1.z.string().trim().min(50),
    excerpt: zod_1.z.string().trim().max(300).optional(),
    category: zod_1.z.string().trim().min(1, "Category is required"),
    status: zod_1.z.enum(["draft", "published"]).default("draft"),
    metaTitle: zod_1.z.string().trim().max(70).optional(),
    metaDescription: zod_1.z.string().trim().max(160).optional(),
});
exports.updateBlogSchema = exports.createBlogSchema.partial();
exports.createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(2).max(1000),
});
//# sourceMappingURL=blog.validator.js.map