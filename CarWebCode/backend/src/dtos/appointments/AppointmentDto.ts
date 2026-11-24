
export type AppointmentType =
  | 'Viewing'
  | 'Test drive'
  | 'Purchase';

export interface CreateAppointmentDto {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  carId: number;
  appointmentType: AppointmentType;
  appointmentDatetime: string;
}

export interface AppointmentResponseDto {
  appointmentId: number;
  status: string;
}

export interface AppointmentListDto {
  appointmentId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  carId: number | null;
  car: string | null;
  appointmentType: AppointmentType | 'Sale evaluation';
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