"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    tutor: { type: mongoose_1.Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    student: { type: mongoose_1.Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    tuitionPost: { type: mongoose_1.Schema.Types.ObjectId, ref: "TuitionPost", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
}, { timestamps: true });
// One review per student per completed tuition post.
reviewSchema.index({ tuitionPost: 1, student: 1 }, { unique: true });
exports.Review = (0, mongoose_1.model)("Review", reviewSchema);
//# sourceMappingURL=review.model.js.map