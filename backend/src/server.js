import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import seedData from "./config/seed.js";
import { startExpiryJob } from "./jobs/expiryJob.js";

const port = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedData();
  startExpiryJob();

  const server = app.listen(port, () => {
    console.log(`MediAlert AI API running on port ${port}`);
  });

  process.on("unhandledRejection", (error) => {
    console.error("Unhandled rejection:", error);
    server.close(() => process.exit(1));
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
