
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { dbConnection } from '../conf/dbConnection';

const router = Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({
            message: 'El correo y la contraseña son obligatorios'
        });
        return;
    }

    try {
        const [rows]: any = await dbConnection.execute(
            `SELECT EmployeeId, Name, Email, Password, IsActive
             FROM employee
             WHERE Email = ?
             LIMIT 1`,
            [email]
        );

        if (rows.length === 0 || !rows[0].IsActive) {
            res.status(401).json({
                message: 'Correo o contraseña incorrectos'
            });
            return;
        }

        const employee = rows[0];
        const passwordIsValid = await bcrypt.compare(
            password,
            employee.Password
        );

        if (!passwordIsValid) {
            res.status(401).json({
                message: 'Correo o contraseña incorrectos'
            });
            return;
        }

        res.json({
            message: 'Inicio de sesión exitoso',
            employee: {
                id: employee.EmployeeId,
                name: employee.Name,
                email: employee.Email
            }
        });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

export default router;
