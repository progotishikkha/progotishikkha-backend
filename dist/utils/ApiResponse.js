"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    success;
    statusCode;
    message;
    data;
    constructor(statusCode, data, message = "Success") {
        this.success = true;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=ApiResponse.js.map