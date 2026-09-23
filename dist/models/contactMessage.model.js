"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactMessage = void 0;
const mongoose_1 = require("mongoose");
const contactMessageSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ["new", "read", "resolved"], default: "new", index: true },
}, { timestamps: true });
exports.ContactMessage = (0, mongoose_1.model)("ContactMessage", contactMessageSchema);
//# sourceMappingURL=contactMessage.model.js.map