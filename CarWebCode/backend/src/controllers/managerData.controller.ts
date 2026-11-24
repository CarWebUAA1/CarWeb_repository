import type { Request, Response } from "express";
import type { RowDataPacket } from "mysql2";

export const managerDataTables = {
  "stock-movements": {
    name: "stock_movements",
    columns: ["movement_id", "car_id", "spare_part_id", "staff_id", "staff_role", "movement_type", "reason", "movement_date", "created_at", "updated_at"],
    orderBy: "movement_id",
  },
  appointments: {
    name: "appointments",
    columns: ["appointment_id", "client_name", "client_phone", "client_email", "employee_id", "car_id", "decision_by", "appointment_type", "appointment_datetime", "status", "cancel_reason", "created_at", "updated_at"],
    orderBy: "appointment_id",
  },
  "test-drives": {
    name: "test_drives",
    columns: ["test_drive_id", "appointment_id", "employee_id", "car_id", "schedule_start", "schedule_end", "start_time", "end_time", "observations", "created_at", "updated_at"],
    orderBy: "test_drive_id",
  },
  inspections: {
    name: "inspections",
    columns: ["inspection_id", "car_id", "inspection_date", "mechanical_condition", "exterior_condition", "interior_condition", "faults", "damage", "observations", "photos", "result", "created_at", "updated_at"],
    orderBy: "inspection_id",
  },
  trades: {
    name: "trades",
    columns: ["trade_id", "appointment_id", "employee_id", "manager_id", "manager_role", "car_id", "spare_part_id", "trade_type", "status", "price", "estimated_price", "listing_price", "trade_date", "last_price_edit", "reserved_until", "is_active", "active_car_id", "created_at", "updated_at"],
    orderBy: "trade_id",
  },
  documents: {
    name: "documents",
    columns: ["document_id", "trade_id", "document_type", "status", "received_date", "file_path", "created_at", "updated_at"],
    orderBy: "document_id",
  },
  contracts: {
    name: "contracts",
    columns: ["contract_number", "trade_id", "generated_at", "pdf_path", "created_at", "updated_at"],
    orderBy: "contract_number",
  },
  receipts: {
    name: "receipts",
    columns: ["receipt_number", "trade_id", "issue_date", "amount", "created_at", "updated_at"],
    orderBy: "receipt_number",
  },
} as const;

export type ManagerDataQuery = (sql: string) => Promise<RowDataPacket[]>;

export class ManagerDataController {
  constructor(private readonly query: ManagerDataQuery) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const table = Object.entries(managerDataTables)
      .find(([key]) => key === req.params["table"])?.[1];
    if (!table) {
      res.status(404).json({ message: "Table not found." });
      return;
    }

    const columns = table.columns.map((column) => `\`${column}\``).join(", ");
    try {
      const rows = await this.query(
        `SELECT ${columns} FROM \`${table.name}\` ORDER BY \`${table.orderBy}\``
      );
      res.json({ table: table.name, columns: table.columns, rows });
    } catch (error) {
      console.error(`Error listing manager table ${table.name}:`, error);
      res.status(500).json({ message: "Could not load table data." });
    }
  };
}
