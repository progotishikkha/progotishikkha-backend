"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// MUST be the first import: registers a global Mongoose toJSON plugin
// (id instead of _id) before "./app" pulls in every model as a side effect
// of importing routes -> controllers -> models. See mongooseIdPlugin.ts.
require("./config/mongooseIdPlugin");
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const sockets_1 = require("./sockets");
const startServer = async () => {
    await (0, db_1.connectDB)();
    const httpServer = (0, http_1.createServer)(app_1.default);
    (0, sockets_1.initSocket)(httpServer);
    httpServer.listen(env_1.env.PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`🚀 Progoti Shikkha API running on port ${env_1.env.PORT} [${env_1.env.NODE_ENV}]`);
    });
};
startServer();
process.on("unhandledRejection", (reason) => {
    // eslint-disable-next-line no-console
    console.error("❌ Unhandled Rejection:", reason);
    process.exit(1);
});
process.on("uncaughtException", (error) => {
    // eslint-disable-next-line no-console
    console.error("❌ Uncaught Exception:", error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map