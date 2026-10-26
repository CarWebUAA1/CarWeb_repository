import { CarsController } from "../controllers/Cars.Controller.js";
import { Router } from "express";

const router = Router();
const carsController = new CarsController();


router.get('/getAllCars', carsController.getAllCars);
router.get('/getCarsById/:id', carsController.getCarsById);
router.post("/createCar", carsController.createCar);
router.put('/updateCar/:id', carsController.updateCar);
router.patch('/updatePrice/:id', carsController.updatePrice);
router.delete('/deleteCar/:id', carsController.deleteCar);

export default router;