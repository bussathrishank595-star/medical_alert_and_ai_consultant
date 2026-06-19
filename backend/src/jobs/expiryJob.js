import cron from "node-cron";
import { updateExpiryStatuses } from "../services/expiryService.js";

export const startExpiryJob = () => {
  cron.schedule("0 8 * * *", async () => {
    try {
      const result = await updateExpiryStatuses();
      console.log(`Expiry job checked ${result.checked} medicines and updated ${result.updated}`);
    } catch (error) {
      console.error("Expiry job failed:", error);
    }
  });

  updateExpiryStatuses().catch((error) => {
    console.error("Initial expiry status update failed:", error);
  });
};
