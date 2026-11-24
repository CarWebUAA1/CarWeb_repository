import { Router } from "express";
import {
  deleteStaff,
  getOwnStaff,
  listStaff,
  loginUser,
  registerStaff,
  updateOwnStaff,
  updateStaff,
} from "../controllers/userController.ts";
import { authenticateToken, requireManager, requireStaff } from "../middlewares/auth.middleware.ts";

const router = Router();

router.post("/login", loginUser);
router.get("/", authenticateToken, requireManager, listStaff);
router.post("/", authenticateToken, requireManager, registerStaff);
router.put("/:id", authenticateToken, requireManager, updateStaff);
router.delete("/:id", authenticateToken, requireManager, deleteStaff);
router.get("/me/profile", authenticateToken, requireStaff, getOwnStaff);
router.put("/me/profile", authenticateToken, requireStaff, updateOwnStaff);

export default router;
