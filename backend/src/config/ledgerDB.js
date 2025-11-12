// src/config/ledgerDB.js
import mongoose from "mongoose";

const ledgerDB = mongoose.createConnection(
  process.env.SECONDARY_DB_URI_LEDGER || "mongodb+srv://udal:0GQ7g13aXcfYbyVq@uc.z0swbfx.mongodb.net/test",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

ledgerDB.on("connected", () => {
  console.log("✅ Connected to Test (WeightLedger) database");
});

export default ledgerDB;
