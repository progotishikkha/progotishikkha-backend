"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profileController = __importStar(require("../controllers/profile.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_1 = require("../middleware/validate");
const upload_middleware_1 = require("../middleware/upload.middleware");
const profile_validator_1 = require("../validators/profile.validator");
const router = (0, express_1.Router)();
// Public marketplace — search/filter/paginate approved tutors.
router.get("/", (0, validate_1.validateQuery)(profile_validator_1.tutorFiltersSchema), profileController.listTutors);
// `/me/*` routes must be registered before the `/:id` catch-all below, or
// Express would try to look up a TutorProfile with id "me".
router.patch("/me", auth_middleware_1.protect, (0, auth_middleware_1.authorize)("tutor"), (0, validate_1.validateBody)(profile_validator_1.updateTutorProfileSchema), profileController.updateMyTutorProfile);
router.post("/me/photo", auth_middleware_1.protect, (0, auth_middleware_1.authorize)("tutor"), upload_middleware_1.upload.single("photo"), profileController.uploadMyTutorPhoto);
router.get("/:id", profileController.getTutorById); // public — no `protect`, so guests can view tutor profiles
exports.default = router;
//# sourceMappingURL=tutor.routes.js.map