const mongoose = require("mongoose");

const getMongoUri = () =>
  process.env.MONGODB_URI || process.env.MONGO_URI || "";

const redactMongoUri = (uri) =>
  uri.replace(/\/\/([^:/?#]+):([^@]+)@/, "//$1:***@");

const logDnsHelp = (error, uri) => {
  if (
    error?.code === "ECONNREFUSED" &&
    ["querySrv", "queryTxt"].includes(error?.syscall)
  ) {
    console.error(
      "MongoDB Atlas DNS lookup failed. Try using mongodb:// instead of mongodb+srv://.",
    );
    console.error(`URI: ${redactMongoUri(uri)}`);
  }
};

const connectDatabase = async () => {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    throw new Error(
      "Missing MongoDB connection string. Set MONGODB_URI in backend/.env.",
    );
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);

    mongoose.connection.on("error", (err) =>
      console.error("MongoDB runtime error:", err.message),
    );
    mongoose.connection.on("disconnected", () =>
      console.warn("MongoDB disconnected."),
    );

    return connection;
  } catch (error) {
    logDnsHelp(error, mongoUri);
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = { connectDatabase };