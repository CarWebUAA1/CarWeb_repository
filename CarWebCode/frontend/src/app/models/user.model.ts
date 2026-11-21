// POST /api/v1/users/login (backend/src/controllers/userController.ts).
// Only staff log in: customers have no account.

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoggedUser {
  id: number;
  name: string;
  email: string;
  role: string; // 'employee' | 'manager'
}

export interface LoginResponse {
  ok: boolean;
  message: string;
  token: string;
  user?: LoggedUser;
}
