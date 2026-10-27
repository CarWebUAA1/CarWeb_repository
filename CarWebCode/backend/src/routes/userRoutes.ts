import { Router } from "express";
import { registrarUsuario } from "../controllers/userController.ts";

const router = Router();

router.post("/register", registrarUsuario);

export default router;
