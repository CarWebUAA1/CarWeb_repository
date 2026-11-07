import dotenv from 'dotenv';
import { Server } from './server.ts';
import { AppRoutes } from "./routes/index.ts";
import sequelizeConnection from './conf/sequelize.connection.ts';
import { pool } from './conf/dbConnection.ts';
import { startReservationExpiryJob } from './jobs/reservationExpiry.job.ts';
import { MySqlTradeRepository } from './repositories/trade.repository.ts';

dotenv.config();

const port = Number(process.env["PORT"]);

async function main() {
  // ORM
  try {
    await sequelizeConnection.connect();
    const server = new Server({ port, routes: AppRoutes.router });
    server.start();
    // Releases trade reservations older than 72 hours, every 5 minutes.
    startReservationExpiryJob(new MySqlTradeRepository(pool));
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

main();
