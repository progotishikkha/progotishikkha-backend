"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TuitionPost = void 0;
const mongoose_1 = require("mongoose");
const tuitionPostSchema = new mongoose_1.Schema({
    student: { type: mongoose_1.Schema.Types.ObjectId, ref: "StudentProfile", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    class: { type: String, required: true, trim: true, index: true },
    medium: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true, index: true },
    daysPerWeek: { type: Number, required: true, min: 1, max: 7 },
    salary: { type: Number, required: true, min: 0, index: true },
    location: { type: String, required: true, trim: true, index: true },
    teachingMode: { type: String, enum: ["online", "offline", "both"], required: true },
    genderPreference: { type: String, enum: ["male", "female", "any"], default: "any" },
    description: { type: String, required: true, maxlength: 3000 },
    preferredTutor: { type: String, trim: true },
    status: { type: String, enum: ["open", "closed", "filled"], default: "open", index: true },
    deadline: { type: Date, required: true },
    hiredTutor: { type: mongoose_1.Schema.Types.ObjectId, ref: "TutorProfile" },
}, { timestamps: true });
tuitionPostSchema.index({ subject: 1, location: 1, status: 1 });
tuitionPostSchema.index({ title: "text", description: "text" });
exports.TuitionPost = (0, mongoose_1.model)("TuitionPost", tuitionPostSchema);
//# sourceMappingURL=tuitionPost.model.js.map