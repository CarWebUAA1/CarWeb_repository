import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startReservationExpiryJob } from "../src/jobs/reservationExpiry.job.js";
import type { TradeRepository } from "../src/repositories/trade.repository.js";

describe("startReservationExpiryJob", () => {
  const logger = { log: vi.fn(), error: vi.fn() };
  let stop: () => void = () => {};

  beforeEach(() => {
    vi.useFakeTimers();
    logger.log.mockReset();
    logger.error.mockReset();
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  it("runs right away and then on every interval", async () => {
    const repo: TradeRepository = { releaseExpiredReservations: vi.fn().mockResolvedValue([]) };
    stop = startReservationExpiryJob(repo, 1000, logger);
    await vi.advanceTimersByTimeAsync(0);
    expect(repo.releaseExpiredReservations).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(repo.releaseExpiredReservations).toHaveBeenCalledTimes(4);
  });

  it("logs the released trades", async () => {
    const repo: TradeRepository = { releaseExpiredReservations: vi.fn().mockResolvedValue([3, 7]) };
    stop = startReservationExpiryJob(repo, 1000, logger);
    await vi.advanceTimersByTimeAsync(0);
    expect(logger.log).toHaveBeenCalledWith("[reservations] released 2 expired reservation(s): trades 3, 7");
  });

  it("keeps running after a database error", async () => {
    const release = vi.fn().mockRejectedValueOnce(new Error("connection lost")).mockResolvedValue([]);
    stop = startReservationExpiryJob({ releaseExpiredReservations: release }, 1000, logger);
    await vi.advanceTimersByTimeAsync(1000);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(2);
  });

  it("never starts a run while the previous one is still going", async () => {
    let finish: (ids: number[]) => void = () => {};
    const release = vi.fn(() => new Promise<number[]>((resolve) => (finish = resolve)));
    stop = startReservationExpiryJob({ releaseExpiredReservations: release }, 1000, logger);
    await vi.advanceTimersByTimeAsync(5000); // the first run is still pending
    expect(release).toHaveBeenCalledTimes(1);
    finish([]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(release).toHaveBeenCalledTimes(2);
  });

  it("stops when the returned function is called", async () => {
    const repo: TradeRepository = { releaseExpiredReservations: vi.fn().mockResolvedValue([]) };
    startReservationExpiryJob(repo, 1000, logger)();
    await vi.advanceTimersByTimeAsync(5000);
    expect(repo.releaseExpiredReservations).toHaveBeenCalledTimes(1); // only the first, immediate run
  });
});
