import "dotenv/config.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/error.js";
import secondaryDB from "./config/secondaryDB.js";
import authRoutes from "./routes/auth.routes.js";
import materialsRoutes from "./routes/materials.routes.js";
import entriesRoutes from "./routes/entries.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import complianceRoutes from "./routes/compliance.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import { getAllTransactions } from "./controllers/transactions.controller.js";
import { requireAuth } from "./middleware/auth.js";
import panchayatWeightLedgerRoutes from './routes/panchayatWeightLedger.routes.js';

const app = express();

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(rateLimit(60_000, 300));

app.use(cors({
  origin: "*",
  credentials: false,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.post("/superadmin", (req, res) => {
  const { username, password } = req.body; 

  if (username === "mrf123" && password === "mrf1234") {
    res.status(200).json({ message: "Access accepted " });
  } else if(username === "gram123" && password === "gram1234") {
    res.status(200).json({ message: "Access accepted " });
  }else if(username === "zilla123" && password === "zilla1234") {
    res.status(200).json({message: "Access accepted"});
  }else{
    res.status(401).json({ message: "Access denied" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/materials", materialsRoutes);
app.use("/api/entries", entriesRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/transactions", transactionsRoutes);
// TEMPORARY: Direct route test to verify routing works
// Remove this after confirming the router route works
app.get("/api/transactions/all-test", requireAuth, (req, res, next) => {
  console.log("[server.js] Direct route /api/transactions/all-test hit!");
  getAllTransactions(req, res, next);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import the new route

// Use the route
app.use('/api', panchayatWeightLedgerRoutes);
console.log("✅ Panchayat routes registered at /api/panchayat-weightledgers");
// Debug: Log route registration
console.log("✅ Transactions routes registered at /api/transactions");
console.log("   Available routes: GET /, GET /history, GET /all, POST /, DELETE /:id");
console.log("   Test route: GET /api/transactions/all-test");
app.get("/api/debug/db", async (req, res) => {
  const collections = await secondaryDB.db.listCollections().toArray();
  res.json({
    connected: secondaryDB.readyState === 1,
    database: secondaryDB.name,
    collections: collections.map(c => c.name),
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
