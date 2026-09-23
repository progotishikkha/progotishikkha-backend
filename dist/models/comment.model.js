"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    blog: { type: mongoose_1.Schema.Types.ObjectId, ref: "Blog", required: true, index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 1000 },
    isApproved: { type: Boolean, default: true },
}, { timestamps: true });
exports.Comment = (0, mongoose_1.model)("Comment", commentSchema);
//# sourceMappingURL=comment.model.js.map