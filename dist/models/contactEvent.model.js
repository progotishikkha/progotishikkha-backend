"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactEvent = void 0;
// Legacy analytics model retained for backward-compatible data. Direct
// student/tutor contact actions have been removed from the user-facing API;
// contact details are exposed only through admin-protected endpoints.
const mongoose_1 = require("mongoose");
const contactEventSchema = new mongoose_1.Schema({
    tutor: { type: mongoose_1.Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    type: { type: String, enum: ["profile_view", "call_click", "whatsapp_click"], required: true },
    actor: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: { createdAt: true, updatedAt: false } });
contactEventSchema.index({ tutor: 1, type: 1, createdAt: -1 });
exports.ContactEvent = (0, mongoose_1.model)("ContactEvent", contactEventSchema);
//# sourceMappingURL=contactEvent.model.js.map