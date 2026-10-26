<<<<<<< Updated upstream
=======
import { Router } from 'express';
import usersRoutes from './userRoutes.ts';

export class AppRoutes {
    static get router(): Router {
        const router = Router();

        router.use('/users', usersRoutes);
        return router;
    }
}
>>>>>>> Stashed changes
