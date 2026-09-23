"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blog = void 0;
const mongoose_1 = require("mongoose");
const blogSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    content: { type: String, required: true },
    excerpt: { type: String, maxlength: 300 },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    featuredImage: {
        url: { type: String },
        publicId: { type: String },
    },
    author: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    metaTitle: { type: String, maxlength: 70 },
    metaDescription: { type: String, maxlength: 160 },
    viewCount: { type: Number, default: 0 },
}, { timestamps: true });
blogSchema.index({ title: "text", content: "text" });
exports.Blog = (0, mongoose_1.model)("Blog", blogSchema);
//# sourceMappingURL=blog.model.js.map