import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { AppointmentRepository } from "../src/repositories/appointment.repository.js";
import { AppointmentService } from "../src/services/appointment.service.js";
import { parseCreateAppointment } from "../src/validators/appointment.js";

/** Next Monday (always a weekday inside the 30-day window) at 10:00. */
function nextMonday(): string {
  const date = new Date();
  date.setDate(date.getDate() + ((8 - date.getDay()) % 7 || 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} 10:00`;
}

const base = {
  clientName: "Ana Lopez",
  clientPhone: "4491234567",
  clientEmail: "ana@mail.com",
  appointmentDatetime: nextMonday(),
};

describe("Appointment creation", () => {
  it("returns the manage token once and stores only its SHA-256 hash", async () => {
    const repository = { create: vi.fn().mockResolvedValue(12) } as unknown as AppointmentRepository;
    const service = new AppointmentService(repository);

    const result = await service.create(parseCreateAppointment({ ...base, carId: 2, appointmentType: "Viewing" }));

    expect(result).toMatchObject({ appointmentId: 12, status: "Pending" });
    expect(result.manageToken).toMatch(/^[0-9a-f]{64}$/);
    const storedHash = vi.mocked(repository.create).mock.calls[0]?.[1];
    expect(storedHash).toBe(createHash("sha256").update(result.manageToken).digest("hex"));
  });

  it("accepts a sale evaluation without a car", () => {
    const input = parseCreateAppointment({ ...base, appointmentType: "Sale evaluation" });
    expect(input.carId).toBeNull();
    expect(input.appointmentType).toBe("Sale evaluation");
  });

  it("still requires a car for the other appointment types", () => {
    expect(() => parseCreateAppointment({ ...base, appointmentType: "Test drive" })).toThrow(/carId/);
  });
});
