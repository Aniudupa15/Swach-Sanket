// src/config/secondaryDB.js
import mongoose from "mongoose";

const secondaryDB = mongoose.createConnection(
  process.env.SECONDARY_DB_URI_PANCHAYAT_WSM || "mongodb+srv://udal:0GQ7g13aXcfYbyVq@uc.z0swbfx.mongodb.net/panchayat-wsm",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

secondaryDB.on("connected", () => {
  console.log("✅ Connected to Panchayat-WSM database");
});

export default secondaryDB;
