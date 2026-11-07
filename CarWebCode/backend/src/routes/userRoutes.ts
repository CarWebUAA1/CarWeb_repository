import { Router } from "express";
import { loginUser } from "../controllers/userController.ts";

const router = Router();

router.post("/login", loginUser);

export default router;
