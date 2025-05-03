// config/db.js (Example)
const mongoose = require("mongoose");
require("dotenv").config(); // For DB connection string

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // useNewUrlParser: true, // Deprecated but good to know
      // useUnifiedTopology: true // Deprecated
    });
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1); // Exit process with failure
  }
};
module.exports = connectDB;

// --- Call connectDB() in your main server.js ---
// const connectDB = require('./config/db');
// connectDB();
