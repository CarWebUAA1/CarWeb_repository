// Values of cars.status (ENUM in sql/schema.sql).
export const CAR_STATUS = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  IN_TEST_DRIVE: "In test drive",
  OUT_OF_SERVICE: "Out of service",
  PENDING_EVALUATION: "Pending evaluation",
  SPARE_PARTS: "Spare parts",
} as const;

export type CarStatus = (typeof CAR_STATUS)[keyof typeof CAR_STATUS];
