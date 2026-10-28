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
