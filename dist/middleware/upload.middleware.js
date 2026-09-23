"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const ApiError_1 = require("../utils/ApiError");
const storage = multer_1.default.memoryStorage();
const fileFilter = (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
        cb(ApiError_1.ApiError.badRequest("Only JPEG, PNG, or WebP images are allowed"));
        return;
    }
    cb(null, true);
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB — profile photos only need to be small
});
//# sourceMappingURL=upload.middleware.js.map