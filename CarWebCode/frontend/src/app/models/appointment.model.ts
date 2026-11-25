// Mirrors backend/src/dtos/appointments/AppointmentDto.ts and controllers/Appointments.controller.ts.
// Datetimes are "YYYY-MM-DD HH:mm:ss" in the dealership's local time.

export type AppointmentType = 'Viewing' | 'Test drive' | 'Purchase' | 'Sale evaluation';

export type AppointmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Rejected'
  | 'Cancelled'
  | 'Completed'
  | 'No show';

export interface CreateAppointment {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  appointmentType: AppointmentType;
  appointmentDatetime: string;
}

export interface AppointmentResponse {
  ok: boolean;
  message: string;
  data: {
    appointmentId: number;
    status: string;
    /** Token of the "manage your appointment" link. Only returned here, once. */
    manageToken: string;
  };
}

// ---- Staff side (GET /appointments, PATCH /:id/status, PATCH /:id/reschedule) ----

export interface StaffAppointment {
  appointmentId: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  carId: number | null;
  car: string | null;
  appointmentType: AppointmentType;
  appointmentDatetime: string;
  status: AppointmentStatus;
  employeeId: number | null;
  employeeName: string | null;
  createdAt: string;
}

export interface StaffAppointmentList {
  ok: boolean;
  data: StaffAppointment[];
}

export type StatusAction = 'Confirmed' | 'Rejected' | 'Cancelled';

// ---- Customer side (manage link: GET /:id/manage, PATCH /:id/modify, PATCH /:id/cancel) ----

export interface ManagedSaleOffer {
  tradeId: number;
  status: string;
  estimatedPrice: number | null;
  listingPrice: number | null;
  lastPriceEdit: string | null;
}

export interface ManagedAppointment {
  appointmentId: number;
  clientName: string;
  appointmentType: AppointmentType;
  appointmentDatetime: string;
  status: AppointmentStatus;
  cancelReason: string | null;
  carId: number | null;
  car: string | null;
  canCancel: boolean;
  canModify: boolean;
  saleOffer: ManagedSaleOffer | null;
}

export interface ModifyAppointmentResponse {
  message: string;
  appointmentId: number;
  previousDatetime: string;
  newDatetime: string;
  status: 'Pending';
}
