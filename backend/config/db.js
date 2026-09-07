const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/strix";
  try {
    await mongoose.connect(uri);
    console.log(`[db] MongoDB connected -> ${uri}`);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    console.error(
      "[db] Is MongoDB running locally? Try `mongod` or set MONGO_URI to an Atlas connection string."
    );
    process.exit(1);
  }
}

module.exports = connectDB;
