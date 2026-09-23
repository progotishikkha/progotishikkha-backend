"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    tuitionPostId: zod_1.z.string().trim().min(1),
    rating: zod_1.z.coerce.number().min(1).max(5),
    comment: zod_1.z.string().trim().max(1000).optional(),
});
//# sourceMappingURL=review.validator.js.map