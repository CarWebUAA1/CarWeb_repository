import express from "express";

class Server {
    public app: any;
    public port: number;

    constructor(){
        this.app = express();
        this.port = Number(process.env.PORT) || 3000;

        this.middlewares();
    }

    middlewares(){
        this.app.use(express.json());
    }

    start(){
        this.app.listen(this.port, () => {
            console.log('Server running on port: ', this.port);
        });
    }
}

export default Server;