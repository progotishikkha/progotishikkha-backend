"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.create = exports.list = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const category_model_1 = require("../models/category.model");
const slugify_1 = require("../utils/slugify");
exports.list = (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const categories = await category_model_1.Category.find().sort({ name: 1 });
    res.status(200).json(new ApiResponse_1.ApiResponse(200, categories));
});
exports.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const slug = (0, slugify_1.slugify)(req.body.name);
    const exists = await category_model_1.Category.findOne({ slug });
    if (exists)
        throw ApiError_1.ApiError.conflict("A category with this name already exists");
    const category = await category_model_1.Category.create({ name: req.body.name, slug });
    res.status(201).json(new ApiResponse_1.ApiResponse(201, category, "Category created"));
});
exports.remove = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const category = await category_model_1.Category.findByIdAndDelete(req.params.id);
    if (!category)
        throw ApiError_1.ApiError.notFound("Category not found");
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "Category deleted"));
});
//# sourceMappingURL=category.controller.js.map