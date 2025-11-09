// routes/entries.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getEntryByDate,
  upsertEntry,
  deleteEntry,
  listHistory,
  aggregateAllPlants
} from "../controllers/entries.controller.js";

const router = Router();

router.get("/", requireAuth, getEntryByDate);                 // ?dateKey=YYYY-MM-DD [&plantId=plant1]
router.get("/history", requireAuth, listHistory);             // ?limit=30 [&plantId=plant1]
router.get("/aggregate", requireAuth, aggregateAllPlants);    // ?dateKey=YYYY-MM-DD  OR ?from=YYYY-MM-DD&to=YYYY-MM-DD [&plants=plant1,plant2]
router.put("/:dateKey", requireAuth, upsertEntry);            // body: { data: { name: number }, plantId?: "plant1" }
router.delete("/:dateKey", requireAuth, deleteEntry);         // ?plantId=plant1

export default router;
