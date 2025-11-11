// routes/transactions.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getTransactionsByDate,
  createTransaction,
  getTransactionsHistory,
  deleteTransaction,
  getAllTransactions,
} from "../controllers/transactions.controller.js";

const router = Router();

/**
 * All routes require authentication
 */

// Debug: Log router initialization
console.log("[transactions.routes] Router initialized");

// GET /api/transactions?dateKey=YYYY-MM-DD
router.get("/", requireAuth, getTransactionsByDate);

// GET /api/transactions/history?limit=30
router.get("/history", requireAuth, getTransactionsHistory);

// GET /api/transactions/all?limit=100&from=YYYY-MM-DD&to=YYYY-MM-DD
// Get all transactions (zilla_panchayat only)
// IMPORTANT: This must come before the /:id route to avoid route conflicts
// Using exact path matching to ensure it's recognized
router.get("/all", (req, res, next) => {
  console.log(`[transactions/all] Route matched! Method: ${req.method}, Path: ${req.path}, OriginalUrl: ${req.originalUrl}`);
  // Apply auth middleware manually
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    getAllTransactions(req, res, next);
  });
});

// POST /api/transactions
router.post("/", requireAuth, createTransaction);

// DELETE /api/transactions/:id
router.delete("/:id", requireAuth, deleteTransaction);

// Debug: Catch-all to see unmatched routes
router.use((req, res, next) => {
  console.log(`[transactions.routes] Unmatched route: ${req.method} ${req.path}`);
  next();
});

export default router;

