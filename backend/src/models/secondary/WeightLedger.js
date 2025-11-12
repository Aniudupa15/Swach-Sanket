import mongoose from "mongoose";
import ledgerDB from "../../config/ledgerDB.js";

const weightLedgerSchema = new mongoose.Schema({
  date: Date,
  dryWasteStored: Number,
  userId: String,
  wetWasteCollected: Number,
  sanitaryWasteCollected: Number,
});

export default ledgerDB.model("WeightLedger", weightLedgerSchema, "weightledgers");
