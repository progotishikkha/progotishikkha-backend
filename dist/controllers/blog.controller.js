"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listComments = exports.addComment = exports.remove = exports.update = exports.getBySlug = exports.listAllForAdmin = exports.listPublished = exports.create = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const blogService = __importStar(require("../services/blog.service"));
const upload_service_1 = require("../services/upload.service");
exports.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const blog = await blogService.createBlog(req.user.id, req.body);
    if (req.file) {
        const result = await (0, upload_service_1.uploadBufferToCloudinary)(req.file.buffer, "blog");
        blog.featuredImage = result;
        await blog.save();
    }
    res.status(201).json(new ApiResponse_1.ApiResponse(201, blog, "Blog post created"));
});
exports.listPublished = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { category, search, page = "1", limit = "9" } = req.query;
    const result = await blogService.listPublishedBlogs({
        category,
        search,
        page: Number(page),
        limit: Number(limit),
    });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, result.blogs));
});
exports.listAllForAdmin = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const blogs = await blogService.listAllBlogsForAdmin();
    res.status(200).json(new ApiResponse_1.ApiResponse(200, blogs));
});
exports.getBySlug = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const blog = await blogService.getBlogBySlug(req.params.slug);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, blog));
});
exports.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const blog = await blogService.updateBlog(req.params.id, req.body);
    if (req.file) {
        const result = await (0, upload_service_1.uploadBufferToCloudinary)(req.file.buffer, "blog");
        blog.featuredImage = result;
        await blog.save();
    }
    res.status(200).json(new ApiResponse_1.ApiResponse(200, blog, "Blog post updated"));
});
exports.remove = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await blogService.deleteBlog(req.params.id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "Blog post deleted"));
});
exports.addComment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const comment = await blogService.addComment(req.params.slug, req.user.id, req.body.content);
    res.status(201).json(new ApiResponse_1.ApiResponse(201, comment, "Comment added"));
});
exports.listComments = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const comments = await blogService.listComments(req.params.slug);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, comments));
});
//# sourceMappingURL=blog.controller.js.map