import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";

type ZodSchema = AnyZodObject | ZodEffects<AnyZodObject>;

/**
 * Validates req.body against the given Zod schema, replacing req.body with
 * the parsed (and therefore sanitized/coerced) result. Errors are forwarded
 * to the centralized error handler, which formats ZodError responses.
 */
export const validateBody =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(result.error);
    }

    req.body = result.data;
    next();
  };

/** Validates req.query, replacing it with the parsed (typed, defaulted) result. */
export const validateQuery =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return next(result.error);
    }

    // req.query is a getter-only property on some Express versions; assign via Object.assign.
    Object.assign(req.query, result.data);
    next();
  };
