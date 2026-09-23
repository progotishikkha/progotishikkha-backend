"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadBufferToCloudinary = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadBufferToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({ folder: `progoti-shikkha/${folder}`, resource_type: "image" }, (error, result) => {
            if (error || !result) {
                reject(error ?? new Error("Cloudinary upload failed"));
                return;
            }
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        uploadStream.end(buffer);
    });
};
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
const deleteFromCloudinary = async (publicId) => {
    await cloudinary_1.default.uploader.destroy(publicId);
};
exports.deleteFromCloudinary = deleteFromCloudinary;
//# sourceMappingURL=upload.service.js.map