// controllers/entries.controller.js
import { z } from "zod";
import { Entry } from "../models/Entry.js";
import { User } from "../models/User.js";
import { toISTDateKey } from "../utils/date.js";

/**
 * Schemas
 */
const upsertSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data: z.record(z.string(), z.number().nonnegative().finite()).default({}),
  plantId: z.string().optional()
});

/**
 * GET /api/entries?dateKey=YYYY-MM-DD[&plantId=...]
 *
 * - If plantId is provided, returns the entry for that plant & date (if any).
 * - If plantId is NOT provided, returns the entry for the authenticated user (existing behaviour).
 */
export const getEntryByDate = async (req, res, next) => {
  try {
    const dateKey = req.query.dateKey || toISTDateKey();
    const plantId = req.query.plantId;

    let entry = null;

    if (plantId) {
      // fetch by plant + date
      entry = await Entry.findOne({ plantId, dateKey }).lean();
    } else {
      // existing behaviour: fetch by user + date
      entry = await Entry.findOne({ user: req.user._id, dateKey }).lean();
    }

    res.json({ entry: entry || { dateKey, data: {} } });
  } catch (e) {
    next(e);
  }
};

/**
 * PUT /api/entries/:dateKey
 *
 * Body: { data: { ... }, plantId?: "plant1" }
 *
 * - If plantId is provided in body, it will upsert the entry for that plant.
 * - Otherwise it will upsert the entry for the authenticated user (existing behaviour).
 */
export const upsertEntry = async (req, res, next) => {
  try {
    const parsed = upsertSchema.parse({ ...req.body, dateKey: req.params.dateKey });
    const { dateKey, data, plantId } = parsed;

    // Clean numeric values
    const cleaned = {};
    Object.entries(data).forEach(([k, v]) => {
      const num = Number(v);
      if (!Number.isNaN(num)) cleaned[k] = Math.max(0, num);
    });

    // Decide query key: by plantId OR by user
    let query;
    let update;
    if (plantId) {
      query = { plantId, dateKey };
      update = { 
        $set: { data: cleaned, plantId, user: req.user._id },
        $setOnInsert: { dateKey }
      };
    } else {
      // When plantId is not provided, try to find existing entry by user
      const existingEntry = await Entry.findOne({ user: req.user._id, dateKey }).lean();
      
      if (existingEntry && existingEntry.plantId) {
        // If entry exists with a plantId, use that
        query = { plantId: existingEntry.plantId, dateKey };
        update = { 
          $set: { data: cleaned, plantId: existingEntry.plantId, user: req.user._id },
          $setOnInsert: { dateKey }
        };
      } else {
        // For backward compatibility: query by user only
        // Check if there's an entry with null/missing plantId for this user+date
        query = { 
          user: req.user._id, 
          dateKey,
          $or: [
            { plantId: { $exists: false } },
            { plantId: null }
          ]
        };
        update = { 
          $set: { data: cleaned, user: req.user._id },
          $setOnInsert: { dateKey }
        };
      }
    }

    try {
      const entry = await Entry.findOneAndUpdate(
        query,
        update,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      res.json({ message: "Saved", entry });
    } catch (updateError) {
      // Handle duplicate key error - might happen if index hasn't been updated yet
      if (updateError.code === 11000 && updateError.keyPattern?.plantId) {
        // Try to find existing entry and update it instead
        const existing = await Entry.findOne({ 
          dateKey, 
          $or: [
            { plantId: null },
            { plantId: { $exists: false } }
          ]
        }).lean();
        
        if (existing) {
          const updated = await Entry.findByIdAndUpdate(
            existing._id,
            { $set: { data: cleaned, user: req.user._id } },
            { new: true }
          ).lean();
          return res.json({ message: "Saved", entry: updated });
        }
        
        // If still failing, return error with helpful message
        return res.status(400).json({ 
          message: "Duplicate entry detected. Please provide a plantId or run the index migration script.",
          error: "Please run: node src/scripts/fix-entry-index.js"
        });
      }
      throw updateError;
    }
  } catch (e) {
    next(e);
  }
};

/**
 * DELETE /api/entries/:dateKey[?plantId=plant1]
 *
 * - If plantId query param provided, deletes entry for that plant + date.
 * - Otherwise deletes the authenticated user's entry for that date.
 */
export const deleteEntry = async (req, res, next) => {
  try {
    const dateKey = req.params.dateKey;
    const plantId = req.query.plantId;

    if (plantId) {
      await Entry.findOneAndDelete({ plantId, dateKey });
    } else {
      await Entry.findOneAndDelete({ user: req.user._id, dateKey });
    }

    res.json({ message: "Deleted", dateKey });
  } catch (e) {
    next(e);
  }
};

/**
 * Helper function to extract plantId from user email
 */
const getPlantIdFromEmail = (email) => {
  if (!email) return null;
  const emailLower = email.toLowerCase();
  const plantIds = ["yedapadavu", "narikombu", "ujire", "kedambadi"];
  for (const plantId of plantIds) {
    if (emailLower.includes(plantId)) {
      return plantId;
    }
  }
  return null;
};

/**
 * GET /api/entries/history?limit=30[&plantId=plant1]
 *
 * - If zilla_panchayat role: returns all entries (populated with user data)
 * - If plantId provided: returns history for that plant.
 * - Otherwise: returns history for authenticated user.
 */
export const listHistory = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 200);
    const plantId = req.query.plantId;

    let q = {};
    let shouldPopulate = false;

    // If zilla_panchayat role, fetch all entries
    if (req.user.role === 'zilla_panchayat') {
      if (plantId) {
        // For zilla_panchayat, also include entries without plantId that match via user email
        q = {
          $or: [
            { plantId },
            { 
              plantId: { $exists: false },
              // We'll filter by user email after populating
            },
            { plantId: null }
          ]
        };
      } else {
        // Fetch all entries for zilla_panchayat
        q = {};
      }
      shouldPopulate = true;
    } else if (plantId) {
      q = { plantId };
    } else {
      q = { user: req.user._id };
    }

    let entries = await Entry.find(q)
      .populate(shouldPopulate ? 'user' : '', 'email name role')
      .sort({ dateKey: -1 })
      .limit(limit)
      .lean();

    // For zilla_panchayat with plantId filter, also check entries without plantId
    if (req.user.role === 'zilla_panchayat' && plantId) {
      // Filter entries where user email matches the plantId
      entries = entries.filter(entry => {
        if (entry.plantId === plantId) return true;
        if (!entry.plantId && entry.user) {
          const emailPlantId = getPlantIdFromEmail(entry.user.email);
          return emailPlantId === plantId;
        }
        return false;
      });
    }

    // Add plantId from user email if missing
    entries = entries.map(entry => {
      if (!entry.plantId && entry.user) {
        const emailPlantId = getPlantIdFromEmail(entry.user.email);
        if (emailPlantId) {
          entry.plantId = emailPlantId;
        }
      }
      return entry;
    });

    res.json({ entries });
  } catch (e) {
    next(e);
  }
};

/**
 * NEW: GET /api/entries/aggregate
 *
 * Behavior required:
 * - Primary input is a single date (dateKey=YYYY-MM-DD). If not provided, defaults to today's IST date.
 * - Optional: from & to (date range). If provided, range used instead of single date.
 * - Optional: plants=comma,separated list. If omitted, default to all four plants.
 * - Also includes entries without plantId by mapping via user email
 *
 * Example:
 *  GET /api/entries/aggregate?dateKey=2025-11-08
 *  GET /api/entries/aggregate?dateKey=2025-11-08&plants=yedapadavu,narikombu
 *  GET /api/entries/aggregate?from=2025-11-01&to=2025-11-07
 */
export const aggregateAllPlants = async (req, res, next) => {
  try {
    // Accept dateKey OR a range (from,to). If neither, default dateKey to today (IST).
    let { dateKey, from, to, plants } = req.query;

    if (!dateKey && !(from && to)) {
      // default to today's dateKey in IST
      dateKey = toISTDateKey();
    }

    const ALL_PLANTS = ["yedapadavu", "narikombu", "ujire", "kedambadi"];

    // parse plants param; default to ALL_PLANTS when not provided or empty
    let plantArray = ALL_PLANTS;
    if (typeof plants === "string" && plants.trim().length > 0) {
      plantArray = plants.split(",").map(p => p.trim()).filter(Boolean);
      // sanitize: only allow known plant ids
      plantArray = plantArray.filter(p => ALL_PLANTS.includes(p));
      if (plantArray.length === 0) plantArray = ALL_PLANTS;
    }

    // build query: include entries with plantId OR without plantId (to map via user email)
    const q = {
      $or: [
        { plantId: { $in: plantArray } },
        { plantId: { $exists: false } },
        { plantId: null }
      ]
    };
    if (dateKey) q.dateKey = dateKey;
    else if (from && to) q.dateKey = { $gte: from, $lte: to };
    // If no date filter, fetch all entries (for zilla_panchayat to see all data)

    // find matching entries and populate user to get email
    const entries = await Entry.find(q)
      .populate('user', 'email name role')
      .lean();

    console.log(`[aggregateAllPlants] Found ${entries.length} entries for query:`, JSON.stringify(q));
    console.log(`[aggregateAllPlants] Sample entries:`, entries.slice(0, 2).map(e => ({
      _id: e._id,
      dateKey: e.dateKey,
      plantId: e.plantId,
      userEmail: e.user?.email || 'N/A',
      hasData: !!e.data && Object.keys(e.data).length > 0
    })));

    // Build a user-to-plantId mapping from MRF operators
    // This helps when user emails don't contain plantId
    const userToPlantMap = new Map();
    try {
      const mrfOperators = await User.find({ role: 'mrf_operator' }).select('_id email').lean();
      mrfOperators.forEach(op => {
        const plantId = getPlantIdFromEmail(op.email);
        if (plantId) {
          userToPlantMap.set(op._id.toString(), plantId);
        }
      });
      console.log(`[aggregateAllPlants] Built user-to-plant mapping for ${userToPlantMap.size} operators`);
    } catch (err) {
      console.error(`[aggregateAllPlants] Error building user-to-plant map:`, err);
    }

    // Aggregate per plant and overall
    const perPlant = {};
    const overall = {};
    // initialize perPlant with empty objects for predictable keys
    plantArray.forEach(pid => (perPlant[pid] = {}));

    let skippedCount = 0;
    let processedCount = 0;

    entries.forEach(entry => {
      // Determine plantId: use entry.plantId or extract from user email or lookup in map
      let pid = entry.plantId;
      if (!pid && entry.user) {
        // Try to extract from email first
        if (entry.user.email) {
          pid = getPlantIdFromEmail(entry.user.email);
        }
        // If still no plantId, try looking up in user-to-plant map
        if (!pid && entry.user._id) {
          const userId = entry.user._id.toString();
          pid = userToPlantMap.get(userId);
          if (pid) {
            console.log(`[aggregateAllPlants] Entry ${entry._id}: mapped to plantId "${pid}" via user lookup`);
          }
        }
      }
      
      // Only process if pid matches one of the requested plants
      if (!pid || !plantArray.includes(pid)) {
        skippedCount++;
        if (skippedCount <= 5) { // Log first 5 skipped entries for debugging
          console.log(`[aggregateAllPlants] Skipping entry ${entry._id}: plantId="${pid}", userEmail="${entry.user?.email || 'N/A'}", userId="${entry.user?._id || 'N/A'}"`);
        }
        return; // Skip entries that don't match any requested plant
      }

      processedCount++;
      const dataObj = entry.data || {};
      const items = (dataObj instanceof Map) ? Array.from(dataObj.entries()) : Object.entries(dataObj);

      items.forEach(([name, val]) => {
        const weight = Number(val) || 0;
        perPlant[pid][name] = (perPlant[pid][name] || 0) + weight;
        overall[name] = (overall[name] || 0) + weight;
      });
    });

    console.log(`[aggregateAllPlants] Processed ${processedCount} entries, skipped ${skippedCount} entries`);

    res.json({
      query: {
        dateKey: dateKey || null,
        from: from || null,
        to: to || null,
        plants: plantArray
      },
      counts: { perPlant, overall },
      meta: { entriesCount: entries.length }
    });
  } catch (e) {
    next(e);
  }
};
