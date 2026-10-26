
import CarsRoutes from "./Cars.routes.js";
import { Router } from 'express';
import usersRoutes from './userRoutes.ts';

export class AppRoutes {
    static get router(): Router {
        const router = Router();

        router.use("/cars", CarsRoutes);
        router.use('/users', usersRoutes);
        return router;
    }
}
