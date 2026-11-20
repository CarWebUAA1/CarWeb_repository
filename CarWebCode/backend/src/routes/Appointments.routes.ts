import { AppointmentsController } from "../controllers/Appointments.controller.js";
import { Router } from "express";

const router = Router();
const appointmentsController = new AppointmentsController();


router.patch('/:id/modify', appointmentsController.modifyAppointment);

export default router;