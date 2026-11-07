import type { Pool, RowDataPacket } from "mysql2/promise";

export interface TradeRepository {
  /** Releases reservations past their 72-hour limit. Returns the ids of the released trades. */
  releaseExpiredReservations(): Promise<number[]>;
}

interface ExpiredTradeRow extends RowDataPacket {
  trade_id: number;
  car_id: number | null;
  spare_part_id: number | null;
}

export class MySqlTradeRepository implements TradeRepository {
  constructor(private readonly db: Pool) {}

  async releaseExpiredReservations(): Promise<number[]> {
    const conn = await this.db.getConnection();
    try {
      await conn.beginTransaction();

      // Only trades still "In progress": a trade pending the manager's approval is not
      // cancelled automatically. NOW() is the database clock, the same one that set reserved_until.
      const [expired] = await conn.query<ExpiredTradeRow[]>(
        `SELECT trade_id, car_id, spare_part_id
           FROM trades
          WHERE is_active = TRUE
            AND status = 'In progress'
            AND reserved_until IS NOT NULL
            AND reserved_until < NOW()
          FOR UPDATE`,
      );
      if (expired.length === 0) {
        await conn.commit();
        return [];
      }

      const tradeIds = expired.map((t) => t.trade_id);
      const carIds = expired.map((t) => t.car_id).filter((id): id is number => id !== null);
      const partIds = expired.map((t) => t.spare_part_id).filter((id): id is number => id !== null);

      await conn.query(
        "UPDATE trades SET is_active = FALSE, status = 'Cancelled' WHERE trade_id IN (?)",
        [tradeIds],
      );
      if (carIds.length > 0) {
        await conn.query("UPDATE cars SET status = 'Available' WHERE car_id IN (?) AND status = 'Reserved'", [carIds]);
      }
      if (partIds.length > 0) {
        await conn.query(
          "UPDATE spare_parts SET status = 'Available' WHERE part_id IN (?) AND status = 'Reserved'",
          [partIds],
        );
      }

      await conn.commit();
      return tradeIds;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}
