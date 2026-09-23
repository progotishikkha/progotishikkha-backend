import { Blog } from "../models/blog.model";
import { Comment } from "../models/comment.model";
import { Category } from "../models/category.model";
import { ApiError } from "../utils/ApiError";
import { slugify } from "../utils/slugify";
import { CreateBlogInput, UpdateBlogInput } from "../validators/blog.validator";

const resolveCategoryId = async (categoryInput: string) => {
  // Accept either a category ObjectId or a plain name (auto-create if new).
  let category = await Category.findById(categoryInput).catch(() => null);
  if (!category) {
    const slug = slugify(categoryInput);
    category = await Category.findOneAndUpdate(
      { slug },
      { name: categoryInput, slug },
      { upsert: true, new: true }
    );
  }
  if (!category) throw ApiError.internal("Could not resolve blog category");
  return category._id;
};

const uniqueSlug = async (title: string) => {
  const base = slugify(title);
  let slug = base;
  let counter = 1;
  while (await Blog.exists({ slug })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
};

export const createBlog = async (authorId: string, input: CreateBlogInput) => {
  const categoryId = await resolveCategoryId(input.category);
  const slug = await uniqueSlug(input.title);

  return Blog.create({
    ...input,
    category: categoryId,
    slug,
    author: authorId,
  });
};

export const listPublishedBlogs = async (params: { category?: string; search?: string; page: number; limit: number }) => {
  const query: Record<string, unknown> = { status: "published" };
  if (params.category) query.category = params.category;
  if (params.search) query.$text = { $search: params.search };

  const skip = (params.page - 1) * params.limit;
  const [blogs, total] = await Promise.all([
    Blog.find(query).populate("category", "name slug").sort({ createdAt: -1 }).skip(skip).limit(params.limit),
    Blog.countDocuments(query),
  ]);

  return { blogs, total };
};

export const listAllBlogsForAdmin = async () => {
  return Blog.find().populate("category", "name slug").populate("author", "fullName").sort({ createdAt: -1 });
};

export const getBlogBySlug = async (slug: string) => {
  const blog = await Blog.findOneAndUpdate(
    { slug, status: "published" },
    { $inc: { viewCount: 1 } },
    { new: true }
  ).populate("category", "name slug").populate("author", "fullName");

  if (!blog) throw ApiError.notFound("Blog post not found");
  return blog;
};

export const updateBlog = async (id: string, input: UpdateBlogInput) => {
  const blog = await Blog.findById(id);
  if (!blog) throw ApiError.notFound("Blog post not found");

  if (input.category) {
    input = { ...input, category: (await resolveCategoryId(input.category)).toString() };
  }

  Object.assign(blog, input);
  await blog.save();
  return blog;
};

export const deleteBlog = async (id: string) => {
  const blog = await Blog.findById(id);
  if (!blog) throw ApiError.notFound("Blog post not found");
  await Comment.deleteMany({ blog: blog._id });
  await blog.deleteOne();
};

export const addComment = async (blogSlug: string, userId: string, content: string) => {
  const blog = await Blog.findOne({ slug: blogSlug });
  if (!blog) throw ApiError.notFound("Blog post not found");

  return Comment.create({ blog: blog._id, user: userId, content });
};

export const listComments = async (blogSlug: string) => {
  const blog = await Blog.findOne({ slug: blogSlug });
  if (!blog) throw ApiError.notFound("Blog post not found");

  return Comment.find({ blog: blog._id, isApproved: true })
    .populate("user", "fullName")
    .sort({ createdAt: -1 });
};
