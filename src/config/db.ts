import mongoose from "mongoose";
import { env } from "./env";

mongoose.set("strictQuery", true);

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.connection.on("connected", () => {
      // eslint-disable-next-line no-console
      console.log("✅ MongoDB connected:", mongoose.connection.host);
    });

    mongoose.connection.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      // eslint-disable-next-line no-console
      console.warn("⚠️  MongoDB disconnected");
    });

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Failed to connect to MongoDB Atlas:", error);

    // Most "backend can't read from MongoDB" reports trace back to one of
    // these three Atlas-side misconfigurations rather than an app bug —
    // surface a pointed hint so it's fixable in seconds instead of a long
    // debugging session.
    const message = error instanceof Error ? error.message : String(error);
    if (/bad auth|authentication failed/i.test(message)) {
      // eslint-disable-next-line no-console
      console.error(
        "   → Looks like an auth failure. Check MONGODB_URI's username/password " +
          "(Atlas → Database Access) and make sure any special characters in the " +
          "password are URL-encoded."
      );
    } else if (/whitelist|ip address|ETIMEDOUT|ENOTFOUND|querySrv/i.test(message)) {
      // eslint-disable-next-line no-console
      console.error(
        "   → Looks like a network/DNS issue. In Atlas → Network Access, add the " +
          "IP address of the machine/host running this server (or 0.0.0.0/0 for " +
          "testing), and double-check the srv connection string is copied exactly."
      );
    }

    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
