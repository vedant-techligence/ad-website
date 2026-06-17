const mongoose = require("mongoose");

const getMongoUri = () => process.env.MONGODB_URI || process.env.MONGO_URI || "";

const redactMongoUri = (uri) => uri.replace(/\/\/([^:/?#]+):([^@]+)@/, "//$1:***@");

const logDnsHelp = (error, uri) => {
  if (error?.code === "ECONNREFUSED" && ["querySrv", "queryTxt"].includes(error?.syscall)) {
    console.error("MongoDB Atlas DNS discovery failed.");
    console.error(`Resolver step: ${error.syscall} ${error.hostname}`);
    console.error("This usually means Node.js cannot query SRV/TXT DNS records on this network.");
    console.error("Recommended fix for Windows/dev networks: use the standard mongodb:// Atlas URI instead of mongodb+srv://.");
    console.error(`Configured URI: ${redactMongoUri(uri)}`);
  }
};

const connectDatabase = async () => {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    throw new Error("Missing MongoDB connection string. Set MONGODB_URI in backend/.env.");
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB runtime error:", error.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected.");
    });

    return connection;
  } catch (error) {
    logDnsHelp(error, mongoUri);
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = { connectDatabase };
