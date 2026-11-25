import { CarsController } from "../controllers/Cars.Controller.js";
import { Router } from "express";
import { authenticateToken, requireManager } from "../middlewares/auth.middleware.js";

const router = Router();
const carsController = new CarsController();

// Inventory changes are for managers only (RegisterAndUpdateInventory).
const managerOnly = [authenticateToken, requireManager];

router.get('/getAllCars', ...managerOnly, carsController.getAllCars);
router.get('/getCarsById/:id', ...managerOnly, carsController.getCarsById);
router.post("/createCar", ...managerOnly, carsController.createCar);
router.put('/updateCar/:id', ...managerOnly, carsController.updateCar);
router.patch('/updatePrice/:id', ...managerOnly, carsController.updatePrice);
router.delete('/deleteCar/:id', ...managerOnly, carsController.deleteCar);
router.get('/filterCars', carsController.filterCars);

export default router;
