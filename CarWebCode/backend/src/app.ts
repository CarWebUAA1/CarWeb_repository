import { Server } from "./server.js";
import routes from "./routes/index.js";
import dotenv from 'dotenv';
<<<<<<< Updated upstream
=======
import { Server } from './server.ts';
import { AppRoutes } from "./routes/index.ts";
import sequelizeConnection from './conf/sequelize.connection.ts';
>>>>>>> Stashed changes

dotenv.config();
const port = Number(process.env['PORT']);

<<<<<<< Updated upstream
function main(){
   const server = new Server({port, routes});
   server.start();
}

=======
const port = Number(process.env["PORT"]);

async function main() {
  // ORM
  try {
    await sequelizeConnection.connect();
    const server = new Server({ port, routes: AppRoutes.router });
    server.start();
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

>>>>>>> Stashed changes
main();