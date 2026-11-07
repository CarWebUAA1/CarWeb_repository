import type { TradeRepository } from "../repositories/trade.repository.js";

export const RESERVATION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Releases trade reservations older than 72 hours (trades.reserved_until).
 *
 * Runs in the backend instead of a MySQL EVENT so it does not depend on the server's
 * event_scheduler setting and the logic stays in the code, covered by tests.
 *
 * Runs once right away and then every `intervalMs`. Returns a function that stops it.
 */
export function startReservationExpiryJob(
  repository: TradeRepository,
  intervalMs = RESERVATION_CHECK_INTERVAL_MS,
  logger: Pick<Console, "log" | "error"> = console,
): () => void {
  let running = false;

  const run = async () => {
    if (running) return; // never overlap two runs
    running = true;
    try {
      const released = await repository.releaseExpiredReservations();
      if (released.length > 0) {
        logger.log(`[reservations] released ${released.length} expired reservation(s): trades ${released.join(", ")}`);
      }
    } catch (error) {
      logger.error("[reservations] could not release expired reservations:", error);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(() => void run(), intervalMs);
  timer.unref(); // the job alone must not keep the process alive
  return () => clearInterval(timer);
}
