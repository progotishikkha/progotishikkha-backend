"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const ApiError_1 = require("../utils/ApiError");
const notFound = (req, _res, next) => {
    next(ApiError_1.ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
exports.notFound = notFound;
//# sourceMappingURL=notFound.js.map