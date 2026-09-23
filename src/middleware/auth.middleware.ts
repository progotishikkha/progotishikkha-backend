import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/token.service";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { UserRole, User } from "../models/user.model";

/** Verifies the JWT access token and attaches { id, role } to req.user. */
export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Authentication token missing");
  }

  const token = header.split(" ")[1];

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired access token");
  }

  // Confirm the user still exists and hasn't been suspended/deactivated
  // since the token was issued.
  const user = await User.findById(payload.sub).select("isActive isSuspended role");
  if (!user || !user.isActive || user.isSuspended) {
    throw ApiError.unauthorized("Account is no longer active");
  }

  req.user = { id: payload.sub, role: payload.role };
  next();
});

/** Restricts a route to the given roles. Must run after `protect`. */
export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }

    next();
  };
