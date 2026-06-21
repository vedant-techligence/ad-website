require("dotenv").config();

const app = require("./app");
const { connectDatabase } = require("./config/db");

require("./jobs/cron");

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const shutdown = () => {
      console.log("Shutting down server...");

      server.close(() => {
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
};

startServer();