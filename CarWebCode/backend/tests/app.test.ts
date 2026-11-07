import { describe, it, expect, vi } from 'vitest';
import { Server } from '../src/server.ts';
import sequelizeConnection from '../src/conf/sequelize.connection.ts';
import { startReservationExpiryJob } from '../src/jobs/reservationExpiry.job.ts';

vi.mock('../src/server.ts');
// The reservation job would query the real database; here it only has to be started.
vi.mock('../src/jobs/reservationExpiry.job.ts', () => ({ startReservationExpiryJob: vi.fn() }));
vi.mock('../src/conf/sequelize.connection.ts',
  () => ({
  default: {
    connect: vi.fn().mockResolvedValue(undefined),
    getSequelize: vi.fn(() => ({
      define: vi.fn(() => ({})),
    })),
  },
})
)
describe('app.ts config testing', ()=>{
    it('should start sever',async ()=>{

        const dbSpy = vi.spyOn(sequelizeConnection, 'connect');
        await import("../src/app.ts");

        expect(dbSpy).toHaveBeenCalledTimes(1);
        expect(Server).toHaveBeenCalledTimes(1);
        expect(Server).toHaveBeenCalledWith({
            port:Number(process.env.PORT),
            routes: expect.any(Function)
        });
        expect(Server.prototype.start).toHaveBeenCalledTimes(1);
        expect(startReservationExpiryJob).toHaveBeenCalledTimes(1);
    });
});
