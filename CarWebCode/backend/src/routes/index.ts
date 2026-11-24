import { Router } from "express";
import { pool } from "../conf/dbConnection.js";
import { CarController } from "../controllers/car.controller.js";
import { MySqlCarRepository } from "../repositories/car.repository.js";
import { CarService } from "../services/car.service.js";
import CarsRoutes from "./Cars.routes.js";
import { createCarRouter } from "./car.routes.js";
import usersRoutes from "./userRoutes.ts";
import { SparePartController } from "../controllers/sparePart.controller.js";
import { MySqlSparePartRepository } from "../repositories/sparePart.repository.js";
import { SparePartService } from "../services/sparePart.service.js";
import { createSparePartRouter } from "./sparePart.routes.js";
import { TestDriveController } from "../controllers/testDrive.controller.js";
import { MySqlTestDriveRepository } from "../repositories/testDrive.repository.js";
import { TestDriveService } from "../services/testDrive.service.js";
import { createTestDriveRouter } from "./testDrive.routes.js";
import { AppointmentController } from "../controllers/appointment.controller.js";
import { MySqlAppointmentRepository } from "../repositories/appointment.repository.js";
import { AppointmentService } from "../services/appointment.service.js";
import { createAppointmentRouter } from "./appointment.routes.js";
import { ManagerDataController } from "../controllers/managerData.controller.js";
import { createManagerDataRouter } from "./managerData.routes.js";
import type { RowDataPacket } from "mysql2";

export class AppRoutes {
    static get router(): Router {
        const router = Router();

        // Inventory management (US-20). Mounted first: its fixed paths (/getAllCars, ...)
        // must be matched before the catalog's GET /:id below.
        router.use("/cars", CarsRoutes);

        // Public catalog (US-03) and car details (US-05): GET /cars?page=N and GET /cars/:id.
        const catalogController = new CarController(new CarService(new MySqlCarRepository(pool)));
        router.use("/cars", createCarRouter(catalogController));

        router.use("/users", usersRoutes);

        // Customer appointment requests.
        const appointmentController = new AppointmentController(
          new AppointmentService(
           new MySqlAppointmentRepository(pool)
          )
        );

        router.use("/appointments", createAppointmentRouter(appointmentController));

        // Test drive scheduling, rejecting overlapping schedules for the same car.
        const testDriveController = new TestDriveController(new TestDriveService(new MySqlTestDriveRepository(pool)));
        router.use("/test-drives", createTestDriveRouter(testDriveController));
        
        const sparePartController = new SparePartController(
            new SparePartService(
                new MySqlSparePartRepository(pool)
            )
        );

        router.use("/spare-parts", createSparePartRouter(sparePartController));

        const managerDataController = new ManagerDataController(async (sql) => {
            const [rows] = await pool.execute<RowDataPacket[]>(sql);
            return rows;
        });
        router.use("/manager/data", createManagerDataRouter(managerDataController));
        
        return router;
    }
}
