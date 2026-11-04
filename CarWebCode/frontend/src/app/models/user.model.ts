// Mirrors the body and responses of POST /api/v1/users/register (backend/src/controllers/userController.ts).

export interface RegisterUserRequest {
  Name: string;
  Phone: string;
  Email: string;
  Password: string;
}

export interface RegisterUserResponse {
  ok: boolean;
  message: string;
  userId?: number;
}

// POST /api/v1/users/login
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoggedUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  ok: boolean;
  message: string;
  user?: LoggedUser;
}
