import { Router } from 'express';
import usersRoutes from './userRoutes.ts';

const router = Router();

router.use('/api/v1/users', usersRoutes);

export default router;