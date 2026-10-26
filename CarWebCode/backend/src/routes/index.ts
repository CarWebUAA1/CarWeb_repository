import CarsRoutes from "./Cars.routes.js";
import { Router } from "express";

const router = Router();

router.use("/cars", CarsRoutes);

export default router;