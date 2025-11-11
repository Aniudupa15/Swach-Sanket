import { Router } from "express";
import { login, register, getUsersByRole } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/users/role/:role", requireAuth, getUsersByRole);

export default router;
