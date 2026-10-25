import { Server } from "./server.js";
import routes from "./routes/index.js";
import dotenv from 'dotenv';

dotenv.config();
const port = Number(process.env['PORT']);

function main(){
   const server = new Server({port, routes});
   server.start();
}

main();