import { Router } from "express";
import { AppointmentsController } from "../controllers/appointments.controller.ts";

const router = Router();
const appointmentsController = new AppointmentsController();


router.patch('/:id/modify', appointmentsController.modifyAppointment);

export default router;
