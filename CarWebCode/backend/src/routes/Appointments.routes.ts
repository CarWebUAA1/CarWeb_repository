import { Router } from "express";
import { AppointmentsController } from "../controllers/Appointments.controller.js";

// Customer side of an appointment (no account): every call proves ownership with the
// token from the "manage your appointment" link.
const router = Router();
const appointmentsController = new AppointmentsController();

router.get('/:id/manage', appointmentsController.getManagedAppointment);
router.patch('/:id/modify', appointmentsController.modifyAppointment);
router.patch('/:id/cancel', appointmentsController.cancelAppointment);

export default router;
