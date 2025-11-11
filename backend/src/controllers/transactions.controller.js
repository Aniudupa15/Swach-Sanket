// controllers/transactions.controller.js
import { z } from "zod";
import { Transaction } from "../models/Transaction.js";

/**
 * Schemas
 */
const createTransactionSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  destination: z.string().min(1, "Destination is required"),
  quantity: z.number().nonnegative().optional().default(0),
  cost: z.number().nonnegative("Cost must be non-negative"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  notes: z.string().optional().default(""),
});

/**
 * GET /api/transactions?dateKey=YYYY-MM-DD
 * Get transactions for a specific date
 */
export const getTransactionsByDate = async (req, res, next) => {
  try {
    const dateKey = req.query.dateKey;
    const query = { user: req.user._id };
    if (dateKey) {
      query.date = dateKey;
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    res.json({ transactions });
  } catch (e) {
    next(e);
  }
};

/**
 * POST /api/transactions
 * Create a new transaction
 */
export const createTransaction = async (req, res, next) => {
  try {
    const parsed = createTransactionSchema.parse(req.body);
    const transaction = await Transaction.create({
      ...parsed,
      user: req.user._id,
    });

    res.status(201).json({
      message: "Transaction created successfully",
      transaction,
    });
  } catch (e) {
    if (e.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error",
        errors: e.errors,
      });
    }
    next(e);
  }
};

/**
 * GET /api/transactions/history?limit=30
 * Get transaction history
 */
export const getTransactionsHistory = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ transactions });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/transactions/all?limit=100[&dateKey=YYYY-MM-DD|&from=YYYY-MM-DD&to=YYYY-MM-DD]
 * Get all transactions (for zilla_panchayat role only)
 * 
 * By default, fetches ALL transactions regardless of date.
 * Optional date filters can be applied via query params:
 * - dateKey: single date filter
 * - from & to: date range filter
 */
export const getAllTransactions = async (req, res, next) => {
  try {
    console.log(`[getAllTransactions] Called - User role: ${req.user?.role}, Query:`, req.query);
    // Only allow zilla_panchayat role
    if (req.user.role !== 'zilla_panchayat') {
      return res.status(403).json({ message: "Access denied. Zilla Panchayat role required." });
    }

    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const { from, to, dateKey } = req.query;
    
    console.log(`[getAllTransactions] Query params - from: ${from}, to: ${to}, dateKey: ${dateKey}, limit: ${limit}`);
    
    // By default, fetch ALL transactions (no date filter)
    // Only apply date filter if explicitly requested
    let query = {};
    if (dateKey) {
      query.date = dateKey;
      console.log(`[getAllTransactions] Using dateKey filter: ${dateKey}`);
    } else if (from && to) {
      query.date = { $gte: from, $lte: to };
      console.log(`[getAllTransactions] Using date range filter: ${from} to ${to}`);
    } else {
      console.log(`[getAllTransactions] No date filter - fetching ALL transactions (overall)`);
    }

    console.log(`[getAllTransactions] MongoDB query:`, JSON.stringify(query));
    
    const transactions = await Transaction.find(query)
      .populate('user', 'name email role')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    console.log(`[getAllTransactions] Found ${transactions.length} transactions`);
    if (transactions.length > 0) {
      console.log(`[getAllTransactions] Sample transaction:`, {
        _id: transactions[0]._id,
        date: transactions[0].date,
        itemName: transactions[0].itemName,
        cost: transactions[0].cost,
        user: transactions[0].user
      });
    }

    // Calculate totals
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.cost || 0), 0);
    const totalQuantity = transactions.reduce((sum, t) => sum + (t.quantity || 0), 0);

    console.log(`[getAllTransactions] Summary - Total: ${transactions.length}, Revenue: ${totalRevenue}, Quantity: ${totalQuantity}`);

    res.json({ 
      transactions,
      summary: {
        total: transactions.length,
        totalRevenue,
        totalQuantity
      }
    });
  } catch (e) {
    next(e);
  }
};

/**
 * DELETE /api/transactions/:id
 * Delete a transaction
 */
export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Transaction deleted successfully" });
  } catch (e) {
    next(e);
  }
};

