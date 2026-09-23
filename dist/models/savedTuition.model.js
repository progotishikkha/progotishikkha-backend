"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedTuition = void 0;
const mongoose_1 = require("mongoose");
const savedTuitionSchema = new mongoose_1.Schema({
    tutor: { type: mongoose_1.Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    tuitionPost: { type: mongoose_1.Schema.Types.ObjectId, ref: "TuitionPost", required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
savedTuitionSchema.index({ tutor: 1, tuitionPost: 1 }, { unique: true });
exports.SavedTuition = (0, mongoose_1.model)("SavedTuition", savedTuitionSchema);
//# sourceMappingURL=savedTuition.model.js.map