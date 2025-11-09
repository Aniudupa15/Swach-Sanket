// controllers/entries.controller.js
import { z } from "zod";
import { Entry } from "../models/Entry.js";
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
 * GET /api/entries?dateKey=YYYY-MM-DD[&plantId=plant1]
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
      entry = await Entry.findOne({ plantId, dateKey });
    } else {
      // existing behaviour: fetch by user + date
      entry = await Entry.findOne({ user: req.user._id, dateKey });
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
      update = { $set: { data: cleaned, plantId } };
    } else {
      query = { user: req.user._id, dateKey };
      update = { $set: { data: cleaned, user: req.user._id } };
    }

    const entry = await Entry.findOneAndUpdate(
      query,
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "Saved", entry });
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
 * GET /api/entries/history?limit=30[&plantId=plant1]
 *
 * - If plantId provided, returns history for that plant.
 * - Otherwise returns history for authenticated user.
 */
export const listHistory = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 90);
    const plantId = req.query.plantId;

    const q = plantId ? { plantId } : { user: req.user._id };

    const entries = await Entry.find(q)
      .sort({ dateKey: -1 })
      .limit(limit);

    res.json({ entries });
  } catch (e) {
    next(e);
  }
};

/**
 * NEW: GET /api/entries/aggregate?dateKey=YYYY-MM-DD
 *      OR /api/entries/aggregate?from=YYYY-MM-DD&to=YYYY-MM-DD
 *      Optional: &plants=plant1,plant2
 *
 * Returns aggregated totals per plant and overall totals across plants.
 */
export const aggregateAllPlants = async (req, res, next) => {
  try {
    const { dateKey, from, to, plants } = req.query;

    // Validate date params
    if (!dateKey && !(from && to)) {
      return res.status(400).json({ message: "Provide dateKey or from+to range" });
    }

    const q = {};
    if (dateKey) {
      q.dateKey = dateKey;
    } else {
      // inclusive range
      q.dateKey = { $gte: from, $lte: to };
    }

    if (plants) {
      const plantArray = plants.split(",").map(p => p.trim()).filter(Boolean);
      if (plantArray.length) q.plantId = { $in: plantArray };
    }

    // fetch all matching entries
    const entries = await Entry.find(q).lean();

    // Aggregate per plant and overall
    const perPlant = {}; // { plantId: { materialName: total } }
    const overall = {};  // { materialName: total }

    entries.forEach(entry => {
      const pid = entry.plantId || "unknown";
      if (!perPlant[pid]) perPlant[pid] = {};

      const dataObj = entry.data || {};
      // dataObj might be a Map (Mongoose Map) or plain object; handle both
      const items = (dataObj instanceof Map) ? Array.from(dataObj.entries()) : Object.entries(dataObj);

      items.forEach(([name, val]) => {
        const weight = Number(val) || 0;
        perPlant[pid][name] = (perPlant[pid][name] || 0) + weight;
        overall[name] = (overall[name] || 0) + weight;
      });
    });

    res.json({
      query: { dateKey, from, to, plants },
      counts: { perPlant, overall },
      meta: { entriesCount: entries.length }
    });
  } catch (e) {
    next(e);
  }
};
