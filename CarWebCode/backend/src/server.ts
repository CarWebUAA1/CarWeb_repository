import express, { Router } from "express";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import cors from "cors";

interface serverOptions{
    port:number,
    routes:Router
}

export class Server {
    server = express();

private readonly port: number;
constructor(options:serverOptions) {
    this.port = options.port;

    // Configured here (not in start) so tests can use `server` without listening on a port.
    this.server.use(express.json());
    this.server.use('/api/v1', options.routes);
    this.server.use(notFoundHandler);
    this.server.use(errorHandler);
}

start() {
    this.server.listen(this.port, () => {
    console.log(`server running on port: ${this.port}`);
    });
  }
}
    private readonly port: number;
    private readonly routes: Router;
    constructor(options:serverOptions) {
        this.port = options.port;
        this.routes = options.routes;
    }

    start() {
        this.server.use(express.json());
        this.server.use(cors());
        this.server.use('/api/v1', this.routes);
        this.server.listen(this.port, () => {
            console.log(`server running on port: ${this.port}`);
        });
    }
}
