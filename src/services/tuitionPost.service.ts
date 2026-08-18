import { FilterQuery } from "mongoose";
import { TuitionPost, ITuitionPost } from "../models/tuitionPost.model";
import { Application } from "../models/application.model";
import { ApiError } from "../utils/ApiError";
import { getStudentProfileIdOrThrow } from "../utils/resolveProfile";
import { matchTutorsForPost } from "./matchingService";
import {
  CreateTuitionPostInput,
  UpdateTuitionPostInput,
  TuitionFiltersInput,
} from "../validators/tuitionPost.validator";

export const createTuitionPost = async (userId: string, input: CreateTuitionPostInput) => {
  const studentId = await getStudentProfileIdOrThrow(userId);
  const post = await TuitionPost.create({ ...input, student: studentId });

  // Fire-and-forget: matching/notifying tutors must never block or fail the
  // student's "post created" response. Any error here is logged, not thrown.
  matchTutorsForPost(post).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`Tutor matching failed for post ${post._id}:`, err instanceof Error ? err.message : err);
  });

  return post;
};

export const listMyTuitionPosts = async (userId: string) => {
  const studentId = await getStudentProfileIdOrThrow(userId);
  return TuitionPost.find({ student: studentId }).sort({ createdAt: -1 });
};

export const listLiveTuitionPosts = async (filters: TuitionFiltersInput) => {
  const query: FilterQuery<ITuitionPost> = { status: "open" };

  if (filters.subject) query.subject = new RegExp(filters.subject, "i");
  if (filters.location) query.location = new RegExp(filters.location, "i");
  if (filters.medium) query.medium = new RegExp(filters.medium, "i");
  if (filters.class) query.class = new RegExp(filters.class, "i");
  if (filters.minSalary || filters.maxSalary) {
    query.salary = {};
    if (filters.minSalary) query.salary.$gte = filters.minSalary;
    if (filters.maxSalary) query.salary.$lte = filters.maxSalary;
  }

  const skip = (filters.page - 1) * filters.limit;

  const [posts, total] = await Promise.all([
    TuitionPost.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit),
    TuitionPost.countDocuments(query),
  ]);

  return { posts, total, page: filters.page, limit: filters.limit };
};

export const getTuitionPostById = async (id: string) => {
  const post = await TuitionPost.findById(id);
  if (!post) throw ApiError.notFound("Tuition post not found");
  return post;
};

const assertOwnership = async (postId: string, userId: string) => {
  const studentId = await getStudentProfileIdOrThrow(userId);
  const post = await TuitionPost.findById(postId);
  if (!post) throw ApiError.notFound("Tuition post not found");
  if (post.student.toString() !== studentId.toString()) {
    throw ApiError.forbidden("You do not own this tuition post");
  }
  return post;
};

export const updateTuitionPost = async (
  postId: string,
  userId: string,
  input: UpdateTuitionPostInput
) => {
  const post = await assertOwnership(postId, userId);
  Object.assign(post, input);
  await post.save();
  return post;
};

export const deleteTuitionPost = async (postId: string, userId: string) => {
  const post = await assertOwnership(postId, userId);
  await Application.deleteMany({ tuitionPost: post._id });
  await post.deleteOne();
};
