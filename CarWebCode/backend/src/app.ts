import dotenv from 'dotenv';
import { Server } from './server.ts';
import { AppRoutes } from "./routes/index.ts";
import sequelizeConnection from './conf/sequelize.connection.ts';

dotenv.config();

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

app.use(cors({
    origin: "http://localhost:4200"
}));

app.use(express.json());

app.use("/api/users", userRoutes);

app.get("/", (_req, res) => {
    res.send("API de CarWeb funcionando");
});

export default app;
