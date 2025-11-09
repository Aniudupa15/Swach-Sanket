import mongoose from "mongoose";

/**
 * Entry model for MRF data.
 *
 * Fields:
 * - user: reference to the user who recorded the entry
 * - plantId: identifier for the MRF plant (e.g. "plant1", "plant2", "plant3", "plant4" or ObjectId)
 * - dateKey: string date key in YYYY-MM-DD (IST)
 * - data: Map of materialName -> weight (Number)
 *
 * Indexes:
 * - Unique index on { plantId, dateKey } to ensure one entry per plant per day
 */

const entrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    plantId: { type: String, enum: ["yedapadavu", "narikombu", "ujire", "kedambadi"], required: true ,index: true}, // e.g. "plant1" or DB ObjectId string
    dateKey: { type: String, required: true, index: true }, // YYYY-MM-DD (IST)
    data: { type: Map, of: Number, default: {} }
  },
  { timestamps: true }
);

// Ensure one entry per plant per date
entrySchema.index({ plantId: 1, dateKey: 1 }, { unique: true });

// (Optional) if you still need quick lookup by user+date, uncomment the next line.
// entrySchema.index({ user: 1, dateKey: 1 }, { unique: false });

export const Entry = mongoose.model("Entry", entrySchema);

