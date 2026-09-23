/**
 * Standalone entrypoint for the donation-overdue sweep (spec section 18).
 *
 * Run this on a schedule against the SAME MongoDB database as the API
 * server. On Render, configure this as a separate "Cron Job" resource
 * (not the always-on web service) so it isn't tied to web traffic:
 *
 *   Build Command: npm install && npm run build
 *   Command:       npm run job:overdue
 *   Schedule:      every 30 minutes, e.g. "*\/30 * * * *"
 *
 * The underlying query (services/admin.service.processOverdueDonations)
 * only ever matches donations still in status "due" whose dueDate has
 * passed, so re-running this on any schedule — even overlapping runs — is
 * safe: a donation that has already moved past "due" is simply skipped.
 * This does NOT require node-cron or any extra dependency; the schedule
 * itself lives in the hosting platform's cron configuration.
 */
import "../config/mongooseIdPlugin";
import { connectDB, disconnectDB } from "../config/db";
import { processOverdueDonations } from "../services/admin.service";

const run = async (): Promise<void> => {
  await connectDB();
  try {
    const result = await processOverdueDonations();
    // eslint-disable-next-line no-console
    console.log(`✅ Overdue donation sweep complete. Donations marked overdue: ${result.processed}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Overdue donation sweep failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

run();
