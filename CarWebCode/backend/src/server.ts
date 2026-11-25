import express, { Router } from "express";
import cors from "cors";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

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
        // Sale offers carry 3-5 photos of up to 5 MB each as base64 (about +33%),
        // so only that route accepts big bodies. The default parser skips already-parsed bodies.
        this.server.use('/api/v1/sale-offers', express.json({ limit: '35mb' }));
        this.server.use(express.json());
        this.server.use(cors());
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
