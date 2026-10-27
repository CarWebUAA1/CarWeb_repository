// Values stored in Cars.StatusOfCar.
export const CAR_STATUS = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  SPARE_PARTS: "Spare parts",
} as const;

export type CarStatus = (typeof CAR_STATUS)[keyof typeof CAR_STATUS];
