import dotenv from 'dotenv';
dotenv.config();

import Server from './server.ts';
import routes from './routes/index.ts';

const server = new Server();

server.app.use(routes);

server.start();