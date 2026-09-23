"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listComments = exports.addComment = exports.deleteBlog = exports.updateBlog = exports.getBlogBySlug = exports.listAllBlogsForAdmin = exports.listPublishedBlogs = exports.createBlog = void 0;
const blog_model_1 = require("../models/blog.model");
const comment_model_1 = require("../models/comment.model");
const category_model_1 = require("../models/category.model");
const ApiError_1 = require("../utils/ApiError");
const slugify_1 = require("../utils/slugify");
const resolveCategoryId = async (categoryInput) => {
    // Accept either a category ObjectId or a plain name (auto-create if new).
    let category = await category_model_1.Category.findById(categoryInput).catch(() => null);
    if (!category) {
        const slug = (0, slugify_1.slugify)(categoryInput);
        category = await category_model_1.Category.findOneAndUpdate({ slug }, { name: categoryInput, slug }, { upsert: true, new: true });
    }
    if (!category)
        throw ApiError_1.ApiError.internal("Could not resolve blog category");
    return category._id;
};
const uniqueSlug = async (title) => {
    const base = (0, slugify_1.slugify)(title);
    let slug = base;
    let counter = 1;
    while (await blog_model_1.Blog.exists({ slug })) {
        slug = `${base}-${counter}`;
        counter += 1;
    }
    return slug;
};
const createBlog = async (authorId, input) => {
    const categoryId = await resolveCategoryId(input.category);
    const slug = await uniqueSlug(input.title);
    return blog_model_1.Blog.create({
        ...input,
        category: categoryId,
        slug,
        author: authorId,
    });
};
exports.createBlog = createBlog;
const listPublishedBlogs = async (params) => {
    const query = { status: "published" };
    if (params.category)
        query.category = params.category;
    if (params.search)
        query.$text = { $search: params.search };
    const skip = (params.page - 1) * params.limit;
    const [blogs, total] = await Promise.all([
        blog_model_1.Blog.find(query).populate("category", "name slug").sort({ createdAt: -1 }).skip(skip).limit(params.limit),
        blog_model_1.Blog.countDocuments(query),
    ]);
    return { blogs, total };
};
exports.listPublishedBlogs = listPublishedBlogs;
const listAllBlogsForAdmin = async () => {
    return blog_model_1.Blog.find().populate("category", "name slug").populate("author", "fullName").sort({ createdAt: -1 });
};
exports.listAllBlogsForAdmin = listAllBlogsForAdmin;
const getBlogBySlug = async (slug) => {
    const blog = await blog_model_1.Blog.findOneAndUpdate({ slug, status: "published" }, { $inc: { viewCount: 1 } }, { new: true }).populate("category", "name slug").populate("author", "fullName");
    if (!blog)
        throw ApiError_1.ApiError.notFound("Blog post not found");
    return blog;
};
exports.getBlogBySlug = getBlogBySlug;
const updateBlog = async (id, input) => {
    const blog = await blog_model_1.Blog.findById(id);
    if (!blog)
        throw ApiError_1.ApiError.notFound("Blog post not found");
    if (input.category) {
        input = { ...input, category: (await resolveCategoryId(input.category)).toString() };
    }
    Object.assign(blog, input);
    await blog.save();
    return blog;
};
exports.updateBlog = updateBlog;
const deleteBlog = async (id) => {
    const blog = await blog_model_1.Blog.findById(id);
    if (!blog)
        throw ApiError_1.ApiError.notFound("Blog post not found");
    await comment_model_1.Comment.deleteMany({ blog: blog._id });
    await blog.deleteOne();
};
exports.deleteBlog = deleteBlog;
const addComment = async (blogSlug, userId, content) => {
    const blog = await blog_model_1.Blog.findOne({ slug: blogSlug });
    if (!blog)
        throw ApiError_1.ApiError.notFound("Blog post not found");
    return comment_model_1.Comment.create({ blog: blog._id, user: userId, content });
};
exports.addComment = addComment;
const listComments = async (blogSlug) => {
    const blog = await blog_model_1.Blog.findOne({ slug: blogSlug });
    if (!blog)
        throw ApiError_1.ApiError.notFound("Blog post not found");
    return comment_model_1.Comment.find({ blog: blog._id, isApproved: true })
        .populate("user", "fullName")
        .sort({ createdAt: -1 });
};
exports.listComments = listComments;
//# sourceMappingURL=blog.service.js.map