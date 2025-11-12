import mongoose from "mongoose";
import secondaryDB from "../../config/secondaryDB.js";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  panchayat: { type: String, required: true },
  dryWasteCapacity: { type: Number, required: true, default: 0 },
  supervisorName: String,
  phone: String,
});

export default secondaryDB.model("User", userSchema, "user"); // explicitly set collection name
