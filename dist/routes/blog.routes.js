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
const blogController = __importStar(require("../controllers/blog.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_1 = require("../middleware/validate");
const upload_middleware_1 = require("../middleware/upload.middleware");
const blog_validator_1 = require("../validators/blog.validator");
const router = (0, express_1.Router)();
// --- Public ---
router.get("/", blogController.listPublished);
router.get("/admin/all", auth_middleware_1.protect, (0, auth_middleware_1.authorize)("admin"), blogController.listAllForAdmin);
router.get("/:slug", blogController.getBySlug);
router.get("/:slug/comments", blogController.listComments);
// --- Admin only ---
router.post("/", auth_middleware_1.protect, (0, auth_middleware_1.authorize)("admin"), upload_middleware_1.upload.single("featuredImage"), (0, validate_1.validateBody)(blog_validator_1.createBlogSchema), blogController.create);
router.patch("/:id", auth_middleware_1.protect, (0, auth_middleware_1.authorize)("admin"), upload_middleware_1.upload.single("featuredImage"), (0, validate_1.validateBody)(blog_validator_1.updateBlogSchema), blogController.update);
router.delete("/:id", auth_middleware_1.protect, (0, auth_middleware_1.authorize)("admin"), blogController.remove);
// --- Authenticated comment ---
router.post("/:slug/comments", auth_middleware_1.protect, (0, validate_1.validateBody)(blog_validator_1.createCommentSchema), blogController.addComment);
exports.default = router;
//# sourceMappingURL=blog.routes.js.map