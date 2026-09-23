"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateBody = void 0;
/**
 * Validates req.body against the given Zod schema, replacing req.body with
 * the parsed (and therefore sanitized/coerced) result. Errors are forwarded
 * to the centralized error handler, which formats ZodError responses.
 */
const validateBody = (schema) => (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return next(result.error);
    }
    req.body = result.data;
    next();
};
exports.validateBody = validateBody;
/** Validates req.query, replacing it with the parsed (typed, defaulted) result. */
const validateQuery = (schema) => (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
        return next(result.error);
    }
    // req.query is a getter-only property on some Express versions; assign via Object.assign.
    Object.assign(req.query, result.data);
    next();
};
exports.validateQuery = validateQuery;
//# sourceMappingURL=validate.js.map