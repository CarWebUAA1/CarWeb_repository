
export type AppointmentType =
  | 'Viewing'
  | 'Test drive'
  | 'Purchase'
  | 'Sale evaluation';

export interface CreateAppointmentDto {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  /** Null only for a "Sale evaluation": the customer's car is not in the inventory yet. */
  carId: number | null;
  appointmentType: AppointmentType;
  appointmentDatetime: string;
}

export interface AppointmentResponseDto {
  appointmentId: number;
  status: string;
  /**
   * Token of the "manage your appointment" link (modify, cancel, offer a car).
   * Returned only once, at creation: the database keeps only its SHA-256 hash.
   */
  manageToken: string;
}

export interface AppointmentListDto {
  appointmentId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  carId: number | null;
  car: string | null;
  appointmentType: AppointmentType;
  appointmentDatetime: string;
  status: string;
  employeeId: number | null;
  employeeName: string | null;
  createdAt: string;
}

export type AppointmentStatusAction =
  | 'Confirmed'
  | 'Rejected'
  | 'Cancelled';

export interface UpdateAppointmentStatusDto {
  status: AppointmentStatusAction;
  reason?: string;
}

export interface RescheduleAppointmentDto {
  appointmentDatetime: string;
}