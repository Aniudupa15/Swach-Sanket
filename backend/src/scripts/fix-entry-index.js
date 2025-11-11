// Script to fix the Entry index issue
// Run this once: node src/scripts/fix-entry-index.js

import mongoose from "mongoose";
import "dotenv/config.js";
import { connectDB } from "../config/db.js";

async function fixIndex() {
  try {
    await connectDB();
    console.log("✅ Connected to database");

    const db = mongoose.connection.db;
    const collection = db.collection("entries");

    // Drop the old index
    try {
      await collection.dropIndex("plantId_1_dateKey_1");
      console.log("✅ Dropped old index");
    } catch (err) {
      if (err.code === 27) {
        console.log("ℹ️  Index doesn't exist, will create new one");
      } else {
        throw err;
      }
    }

    // Create new sparse index
    await collection.createIndex(
      { plantId: 1, dateKey: 1 },
      { unique: true, sparse: true, name: "plantId_1_dateKey_1" }
    );
    console.log("✅ Created new sparse index");

    // Optionally, clean up entries with null plantId (keep only one per dateKey)
    const nullEntries = await collection.find({ plantId: null }).toArray();
    console.log(`ℹ️  Found ${nullEntries.length} entries with null plantId`);

    if (nullEntries.length > 0) {
      // Group by dateKey and keep only the most recent one
      const groupedByDate = {};
      nullEntries.forEach(entry => {
        const dateKey = entry.dateKey;
        if (!groupedByDate[dateKey] || new Date(entry.createdAt) > new Date(groupedByDate[dateKey].createdAt)) {
          groupedByDate[dateKey] = entry;
        }
      });

      // Delete duplicates
      let deletedCount = 0;
      for (const entry of nullEntries) {
        if (groupedByDate[entry.dateKey]._id.toString() !== entry._id.toString()) {
          await collection.deleteOne({ _id: entry._id });
          deletedCount++;
        }
      }
      console.log(`✅ Cleaned up ${deletedCount} duplicate entries with null plantId`);
    }

    console.log("✅ Index fix completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing index:", error);
    process.exit(1);
  }
}

fixIndex();

