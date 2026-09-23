// MUST be the first import: registers a global Mongoose toJSON plugin
// (id instead of _id) before "./app" pulls in every model as a side effect
// of importing routes -> controllers -> models. See mongooseIdPlugin.ts.
import "./config/mongooseIdPlugin";
import { createServer } from "http";
import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { initSocket } from "./sockets";

const startServer = async (): Promise<void> => {
  await connectDB();

  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Progoti Shikkha API running on port ${env.PORT} [${env.NODE_ENV}]`);
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
