
export type AppointmentType = 'Viewing' | 'Test drive' | 'Purchase';

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
  };
}
