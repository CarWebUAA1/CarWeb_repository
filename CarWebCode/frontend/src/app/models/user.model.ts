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
  token: string;
  user?: LoggedUser;
}

export interface StaffMember {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: 'employee' | 'manager';
}

export interface StaffListResponse {
  staff: StaffMember[];
}

export interface StaffDetailsRequest {
  name: string;
  phone: string;
  email: string;
  role: StaffMember['role'];
  password?: string;
}

export interface StaffMutationResponse {
  message: string;
  staffId?: number;
}
