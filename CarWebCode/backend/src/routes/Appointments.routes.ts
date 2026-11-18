import { Router } from "express";
import { AppointmentsController } from "../controllers/appointments.controller.ts";

const router = Router();
const appointmentsController = new AppointmentsController();

router.patch('/:id/cancel', appointmentsController.cancelAppointment);

export default router;
